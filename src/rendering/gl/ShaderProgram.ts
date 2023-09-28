import { vec4, mat4 } from 'gl-matrix';
import Drawable from './Drawable';
import { gl } from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifInnerColor: WebGLUniformLocation;
  unifOuterColor: WebGLUniformLocation;
  unifTick: WebGLUniformLocation;
  unifRadialBias : WebGLUniformLocation;
  unifRadialGain : WebGLUniformLocation;
  unifColorBias : WebGLUniformLocation;
  unifColorGain : WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifInnerColor = gl.getUniformLocation(this.prog, "u_innerColor");
    this.unifOuterColor = gl.getUniformLocation(this.prog, "u_outerColor");
    this.unifTick = gl.getUniformLocation(this.prog, "u_Tick");
    this.unifRadialBias = gl.getUniformLocation(this.prog, "u_radialBias");
    this.unifRadialGain = gl.getUniformLocation(this.prog, "u_radialGain");
    this.unifColorBias = gl.getUniformLocation(this.prog, "u_colorBias");
    this.unifColorGain = gl.getUniformLocation(this.prog, "u_colorGain");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setInnerColor(color: vec4) {
    this.use();
    if (this.unifInnerColor !== -1) {
      gl.uniform4fv(this.unifInnerColor, color);
    }
  }

  setOuterColor(color: vec4) {
    this.use();
    if (this.unifOuterColor !== -1) {
      gl.uniform4fv(this.unifOuterColor, color);
    }
  }

  setRadialBias(bias: number) {
    this.use();
    if (this.unifRadialBias !== -1) {
      gl.uniform1f(this.unifRadialBias, bias);
    }
  }

  setRadialGain(gain: number) {
    this.use();
    if (this.unifRadialGain !== -1) {
      gl.uniform1f(this.unifRadialGain, gain);
    }
  }

  setColorBias(bias: number) {
    this.use();
    if (this.unifColorBias !== -1) {
      gl.uniform1f(this.unifColorBias, bias);
    }
  }

  setColorGain(gain: number) {
    this.use();
    if (this.unifColorGain !== -1) {
      gl.uniform1f(this.unifColorGain, gain);
    }
  }

  setTick(tick: number) {
    this.use();
    if (this.unifTick !== -1) {
      gl.uniform1f(this.unifTick, tick);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
