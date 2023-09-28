#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_innerColor; // The color with which to render this instance of geometry.
uniform vec4 u_outerColor;
uniform float u_radialBias;
uniform float u_radialGain;
uniform float u_colorBias;
uniform float u_colorGain;
uniform float u_Tick;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec3 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

vec3 hash33(vec3 p3) {
	vec3 p = fract(p3 * vec3(.1031,.11369,.13787));
    p += dot(p, p.yxz+19.19);
    return fract(vec3((p.x + p.y)*p.z, (p.x+p.z)*p.y, (p.y+p.z)*p.x));
}

float quinticsmooth(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float surflet(vec3 p, vec3 gridP) {
    vec3 gradient = 2.0 * hash33(gridP) - 1.f;
    vec3 diff = p - gridP;
    float h = dot(diff, gradient);
    for (int i = 0; i < 3; i++) {
        h *= 1.0 - quinticsmooth(abs(p[i] - gridP[i]));
    }
    return h;
}

float perlin(vec3 p) {
    float res = 0.0;
    vec3 cell = floor(p);
    for (int x = 0; x <= 1; x++) {
    for (int y = 0; y <= 1; y++) {
    for (int z = 0; z <= 1; z++) {
        res += surflet(p, cell + vec3(float(x), float(y), float(z)));
    }
    }
    }
    return res;
}

float bias (float b, float t) {
    return pow(t, log(b) / log(0.5f));
}

float gain (float g, float t) {
    if (t < 0.5f) {
        return bias(1.0 - g, 2.0 * t) / 2.0;
    } else {
        return 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) / 2.0;
    }
}

void main()
{
        vec3 r = fs_Pos.xyz;
        float t = length(r);

        // Remap to [0, 1] range:
        t = (t - 0.65) / 0.7;
        
        // Bias and gain for color cutoffs
        t = bias(u_radialBias, t);
        t = gain(u_radialGain, t);

        // Bin color into 5 values
        t *= 4.0;
        t = ceil(t);
        bool bottomLayer = (t == 1.0);
        t /= 4.0;
        

        // Move r in perlin space for sunspotrs
        r.x += u_Tick / 31.4;
        float sunspot = perlin(r * 4.0) / 2.0;

        // Bias and gain for a good palette
        t = bias(u_colorBias, t);
        t = gain(u_colorGain, t);

        vec3 diffuseColor = mix(u_innerColor.rgb, u_outerColor.rgb, t + (bottomLayer ? 1.0 : 0.0) * sunspot);
        
        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

        float ambientTerm = 0.2;
        float centerLight = 0.2 / dot(fs_Pos, fs_Pos);

        float lightIntensity = diffuseTerm + ambientTerm + centerLight;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        vec3 color = diffuseColor * lightIntensity;
        

        out_Col = vec4(color, 1.0);
}
