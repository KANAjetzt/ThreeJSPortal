import "./style.css";
import * as dat from "dat.gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { TAARenderPass } from "three/examples/jsm/postprocessing/TAARenderPass.js";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";
import grassModelVertexShader from "./shaders/grassModel/vertex.glsl";
import grassModelFragmentShader from "./shaders/grassModel/fragment.glsl";
import groundVertexShader from "./shaders/ground/vertex.glsl";
import groundFragmentShader from "./shaders/ground/fragment.glsl";
import { addGrass, customUniforms } from "./grass";

/**
 * Base
 */
// Debug
const debugObject = {};
export const gui = new dat.GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
export const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
export const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
const bakedTexture = textureLoader.load("baked.jpg");
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

/**
 * Materials
 */

const depthMaterial = new THREE.MeshDepthMaterial();

// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
});

debugObject.portalColorStart = "#18c0b2";
debugObject.portalColorEnd = "#00ffff";

gui.addColor(debugObject, "portalColorStart").onChange(() => {
  portalLightMaterial.uniforms.uColorStart.value.set(
    debugObject.portalColorStart
  );
});

gui.addColor(debugObject, "portalColorEnd").onChange(() => {
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

// Portal light material
const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  side: THREE.DoubleSide,
});

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

// Grass model material
debugObject.grassColor = "#00ffff";

const grassModelMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uGrassColor: { value: new THREE.Color(debugObject.grassColor) },
  },
  vertexShader: grassModelVertexShader,
  fragmentShader: grassModelFragmentShader,
});

// Uniforms
grassModelMaterial.uniforms.uTime = customUniforms.uTime;
grassModelMaterial.uniforms.uWindMovement = customUniforms.uWindMovement;
grassModelMaterial.uniforms.uWindDensity = customUniforms.uWindDensity;
grassModelMaterial.uniforms.uWindStrength = customUniforms.uWindStrength;

/**
 * Modals
 */

// Load Portal Scene
gltfLoader.load("portal.glb", (gltf) => {
  console.log(gltf);
  // gltf.scene.traverse((child) => {
  //   child.material = bakedMaterial;
  // });

  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");

  const portalLightMesh = gltf.scene.children.find(
    (child) => child.name === "portalLight"
  );
  const poleLightAMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightA"
  );
  const poleLightBMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightB"
  );

  bakedMesh.material = bakedMaterial;
  portalLightMesh.material = portalLightMaterial;
  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;

  scene.add(gltf.scene);
});

// Load Grass Model
gltfLoader.load("grass2.glb", (gltf) => {
  const grassModel = gltf.scene.children[0];
  console.log(grassModel);
  grassModel.material = grassModelMaterial;

  grassModel.scale.set(0.05, 0.05, 0.05);

  grassModel.updateWorldMatrix();

  // Convert local vectors to world vectors
  const grassModelWorldPosition = new Float32Array(
    grassModel.geometry.attributes.position.array.length
  );

  for (
    let i = 0;
    i < grassModel.geometry.attributes.position.array.length / 3;
    i++
  ) {
    const i3 = i * 3;

    // create vector 3 from position attributes
    const localVector = new THREE.Vector3(
      grassModel.geometry.attributes.position.array[i3 + 0],
      grassModel.geometry.attributes.position.array[i3 + 1],
      grassModel.geometry.attributes.position.array[i3 + 2]
    );

    // convert the vector to world space
    const globalVector = grassModel.localToWorld(localVector);

    // add the vector data in to a new array
    grassModelWorldPosition[i3 + 0] = globalVector.x;
    grassModelWorldPosition[i3 + 1] = globalVector.y;
    grassModelWorldPosition[i3 + 2] = globalVector.z;
  }

  grassModel.geometry.setAttribute(
    "aWorldPosition",
    new THREE.BufferAttribute(grassModelWorldPosition, 3)
  );

  debugObject.grassCount = 50000;

  const createGrassModelMesh = () => {
    // Instanced Mesh
    const grassModelInstanced = new THREE.InstancedMesh(
      grassModel.geometry,
      grassModelMaterial,
      debugObject.grassCount
    );

    for (let i = 0; i < debugObject.grassCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        0,
        (Math.random() - 0.5) * 4
      );

      const quaternion = new THREE.Quaternion();
      quaternion.setFromEuler(
        new THREE.Euler(0, (Math.random() - 0.5) * Math.PI * 2, 0)
      );

      const matrix = new THREE.Matrix4();
      matrix.makeRotationFromQuaternion(quaternion);
      matrix.setPosition(position);

      grassModelInstanced.setMatrixAt(i, matrix);
    }

    return grassModelInstanced;
  };

  let grassModelInstanced = createGrassModelMesh();

  scene.add(grassModelInstanced);

  // Debug
  gui
    .add(debugObject, "grassCount")
    .min(0)
    .max(100000)
    .step(1)
    .onFinishChange(() => {
      // remove mesh
      scene.remove(grassModelInstanced);
      grassModelInstanced = createGrassModelMesh();
      scene.add(grassModelInstanced);
    });
});

/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  const i3 = i * 3;
  // x
  positionArray[i3 + 0] = (Math.random() - 0.5) * 4;
  // y
  positionArray[i3 + 1] = Math.random() * 1.5;
  // z
  positionArray[i3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);

firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Grass Particles
 */

/**
 * Grass
 */
addGrass(0);

/**
 * New ground plane
 */

// Geometry
const groundGeometry = new THREE.PlaneGeometry(4, 4, 1, 1);

const groundMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(debugObject.grassColor) },
  },
  vertexShader: groundVertexShader,
  fragmentShader: groundFragmentShader,
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.set(-(Math.PI * 0.5), 0, 0);
ground.position.set(0, 0.0001, 0);
scene.add(ground);

// Debug
gui.addColor(debugObject, "grassColor").onChange(() => {
  grassModelMaterial.uniforms.uGrassColor.value.set(debugObject.grassColor);
  groundMaterial.uniforms.uColor.value.set(debugObject.grassColor);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update effect composer
  effectComposer.setSize(sizes.width, sizes.height);

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

debugObject.clearColor = "#010f0f";
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});

/**
 * Post processing
 */
const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  encoding: THREE.sRGBEncoding,
});

const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
effectComposer.setSize(sizes.width, sizes.height);

const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

const taaPass = new TAARenderPass(scene, camera);
// effectComposer.addPass(taaPass);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update materials
  portalLightMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  customUniforms.uTime.value = elapsedTime;
  grassModelMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  // renderer.render(scene, camera);
  effectComposer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
