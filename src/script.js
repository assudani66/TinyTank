import "./style.css";
import * as THREE from "three";
import gsap from "gsap";
import * as lil from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { AnimationMixer, ArrowHelper, Light, Mesh, Vector3 } from "three";

// dracoLoader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");

// Canvas and UI buttons
const canvas = document.querySelector("canvas.webgl");
const fire = document.querySelector("#Fire_button");

// Scene
const scene = new THREE.Scene();

/*
 *debug UI
 */

const gui = new lil.GUI();

// textures

const textureloader = new THREE.TextureLoader();
const texture = textureloader.load("image.jpg");

/*
 *Lights
 */

// ambientLight

const ambientLight = new THREE.AmbientLight(0x404040);

// directional Light

const directionalLight = new THREE.DirectionalLight(0x404040);

// ambient Light

scene.add(ambientLight, directionalLight);

// materials

const material = new THREE.MeshStandardMaterial({
  map: texture,
  color: 0x4d7b21,
});

/**
 * Objects
 */

let mixer = null;

var action = null;

let imported_model = null;
const tank_axis = new THREE.AxesHelper(3);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load("./3d_models/base_tank.gltf", (gltf) => {
  mixer = new AnimationMixer(gltf.scene);

  action = mixer.clipAction(gltf.animations[0]);
  imported_model = gltf.scene;
  scene.add(gltf.scene);
  console.log(scene.gltf);
  imported_model.add(tank_axis);
});

const plane = new THREE.PlaneGeometry(10, 10);
const ground = new Mesh(plane, material);

scene.add(ground);
ground.rotation.x = -Math.PI / 2;

const axishelper = new THREE.AxesHelper(10);
scene.add(axishelper);

ground.rotateX = 90;
/**
 * Sizes
 */

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/*
fullscreen
*/

window.addEventListener("resize", () => {
  // update width and height

  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // update renderer size

  renderer.setSize(sizes.width, sizes.height);

  // updating aspect ratio

  camera.aspect = sizes.width / sizes.height;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  camera.updateProjectionMatrix();
});
function fullscreen() {
  window.addEventListener("dblclick", () => {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      console.log("fullscreen");
    }
  });
}

// fullscreen()

/*
 * Camera
 */
const material_missile = new THREE.MeshStandardMaterial();
material_missile.emissive = 0xffc300;
material_missile.emissiveIntensity = 1;

let missile;
function spawn_missile() {
  missile = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 8),
    material_missile
  );
  missile.position.copy(imported_model.position);
  scene.add(missile);
  console.log(missile.position);
}
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 3;
camera.position.y = 5;

scene.add(camera);
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;

/*
 * tank control
 */

let speed = 0.1;
var axis = new THREE.Vector3(0, 1, 0);
var angle = Math.PI / 128;
fire.addEventListener("click", () => {
  action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  action.enable = true;
  action.play();
  action.reset();
  spawn_missile();
});

let backward, forward, left, right;
window.addEventListener("keydown", (e) => {
  if (e.key == "w") {
    forward = true;
  }
  if (e.key == "a") {
    left = true;
  }
  if (e.key == "d") {
    right = true;
  }
  if (e.key == "s") {
    backward = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key == "w") {
    forward = false;
  }
  if (e.key == "a") {
    left = false;
  }
  if (e.key == "d") {
    right = false;
  }
  if (e.key == "s") {
    backward = false;
  }
});

/*
 *Raycaster
 */
const base_cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);

// Test Object

scene.add(base_cube);
gui.add(base_cube.position, "y");

// raycast

const raycaster = new THREE.Raycaster();
const rayorigin = new THREE.Vector3(0, 0, 0);
const raydirection = new THREE.Vector3(10, 0, 0);
raydirection.normalize();
raycaster.set(rayorigin, raydirection);

// arrowHelper

const arrowhelper = new ArrowHelper(raydirection, rayorigin, 1, "0xffff00");
scene.add(arrowhelper);
const intersect = raycaster.intersectObject(base_cube);
console.log(intersect);

/*
 *Renderer
 */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);

/*
animation
*/

let clock = new THREE.Clock();

function renderloop() {
  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
  camera.updateProjectionMatrix();

  // Tank controls

  if (forward) {
    imported_model.translateZ(-speed);
  }
  if (left) {
    imported_model.rotateOnAxis(axis, angle);
  }
  if (backward) {
    imported_model.translateZ(speed);
  }
  if (right) {
    imported_model.rotateOnAxis(axis, -angle);
  }

  //camera controls

  controls.target = imported_model.position;
  controls.update();

  // clock

  let delta_time = clock.getDelta();

  if (mixer != null) {
    mixer.update(delta_time);
  }
}

renderloop();
