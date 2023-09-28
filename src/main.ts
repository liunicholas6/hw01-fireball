import { vec3, vec4 } from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube'
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import { setGL } from './globals';
import ShaderProgram, { Shader } from './rendering/gl/ShaderProgram';

const defaultControls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  'Reset' : reset,
  innerColor: [255, 255, 0],
  outerColor: [255, 0, 0],
  radialBias: 0.45,
  radialGain: 0.8,
  colorBias: 0.5,
  colorGain: 0.4
};

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = Object.assign({}, defaultControls);

let prevControls = Object.assign({}, controls);

function toColor(colorAsList : number[]) {
  let normed = colorAsList.map((x) => x / 255);
  return vec4.fromValues(normed[0], normed[1], normed[2], 1.0);
}

let icosphere: Icosphere;
let square: Square;
let cube: Cube;

let tickCount = 0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function reset() {
  Object.assign(controls, defaultControls);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Reset');
  gui.addColor(controls, 'innerColor');
  gui.addColor(controls, 'outerColor');
  gui.add(controls, 'radialBias', 0, 1).step(0.05);
  gui.add(controls, 'radialGain', 0, 1).step(0.05);
  gui.add(controls, 'colorBias', 0, 1).step(0.05);
  gui.add(controls, 'colorGain', 0, 1).step(0.05);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById('canvas');
  const gl = <WebGL2RenderingContext>canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));
  // camera.makeStatic();

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const fireballShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  const backgroundShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/bkgd-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/bkgd-frag.glsl')),
  ]);

  fireballShader.setInnerColor(toColor(controls.innerColor));
  backgroundShader.setInnerColor(toColor(controls.innerColor));
  fireballShader.setOuterColor(toColor(controls.outerColor));
  backgroundShader.setOuterColor(toColor(controls.outerColor));
  fireballShader.setRadialBias(controls.radialBias);
  fireballShader.setRadialGain(controls.radialGain);
  fireballShader.setColorBias(controls.colorBias);
  fireballShader.setColorGain(controls.colorGain);

  // backgroundShader.setInnerColor(toColor(controls.innerColor));
  // backgroundShader.setOuterColor(toColor(controls.outerColor));

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if (controls.tesselations != prevControls.tesselations) {
      prevControls.tesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevControls.tesselations);
      icosphere.create();
    }
    if (controls.innerColor != prevControls.innerColor) {
      prevControls.innerColor = controls.innerColor;
      fireballShader.setInnerColor(toColor(prevControls.innerColor));
      backgroundShader.setInnerColor(toColor(prevControls.innerColor));
    }
    if (controls.outerColor != prevControls.outerColor) {
      prevControls.outerColor = controls.outerColor;
      fireballShader.setOuterColor(toColor(prevControls.outerColor));
      backgroundShader.setOuterColor(toColor(prevControls.outerColor));
    }
    if (controls.radialBias != prevControls.radialBias) {
      prevControls.radialBias = controls.radialBias;
      fireballShader.setRadialBias(prevControls.radialBias);
    }
    if (controls.radialGain != prevControls.radialGain) {
      prevControls.radialGain = controls.radialGain;
      fireballShader.setRadialGain(prevControls.radialGain);
    }
    if (controls.colorBias != prevControls.colorBias) {
      prevControls.colorBias = controls.colorBias;
      fireballShader.setColorBias(prevControls.colorBias);
    }
    if (controls.colorGain != prevControls.colorGain) {
      prevControls.colorGain = controls.colorGain;
      fireballShader.setColorGain(prevControls.colorGain);
    }
    tickCount += 1;
    fireballShader.setTick(tickCount);
    
    gl.disable(gl.DEPTH_TEST);
    renderer.render(camera, backgroundShader, [square]);
    gl.enable(gl.DEPTH_TEST);
    renderer.render(camera, fireballShader, [
      icosphere,
      // square,
      // cube
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
