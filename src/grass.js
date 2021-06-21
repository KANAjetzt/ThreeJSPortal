import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { textureLoader } from "./script";
import { scene } from "./script";
import { gui } from "./script";
import grassVertexDefinitions from "./shaders/grass/vertexDefinitions.glsl";
import grassVertexShader from "./shaders/grass/vertex.glsl";

export const customUniforms = {
  uTime: { value: 0.0 },
  uWindMovement: { value: new THREE.Vector2(6, 4) },
  uWindDensity: { value: 0.12 },
  uWindStrength: { value: 0.05 },
};

export const addGrass = (amount) => {
  /**
   * Textures
   */

  // Grass blade texture
  const grassColorTexture = textureLoader.load("./grass/baseColor.jpg");
  grassColorTexture.encoding = THREE.sRGBEncoding;
  const grassNormalTexture = textureLoader.load("./grass/normal.png");
  const grassAlphaTexture = textureLoader.load("./grass/alpha.jpg");
  const grassAmbientOcclusionTexture = textureLoader.load(
    "./grass/ambientOcclusion.jpg"
  );
  const grassRoughnessTexture = textureLoader.load("./grass/roughness.jpg");

  /**
   * Lights
   */

  const ambientLight = new THREE.AmbientLight("#ffffff", 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight("#ffffff", 0.1);
  scene.add(directionalLight);

  const pointLight1 = new THREE.PointLight("#ffffff", 0.4);
  pointLight1.position.set(0, 8, -8);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight("#ffffff", 0.4);
  pointLight2.position.set(0, 8, 8);
  scene.add(pointLight2);
  const pointLight3 = new THREE.PointLight("#ffffff", 0.4);
  pointLight3.position.set(8, 8, 0);
  scene.add(pointLight3);
  const pointLight4 = new THREE.PointLight("#ffffff", 0.4);
  pointLight4.position.set(-8, 8, 0);
  scene.add(pointLight4);

  /**
   * Meshes
   */

  // Grass clump geometry
  const grassClumpGeometries = [];

  for (let i = 0; i < 3; i++) {
    const mod3 = i % 3;

    // Grass plane
    const grassGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // Create Star shape with 3 grass planes
    if (mod3 === 0) {
      grassGeometry.rotateY(0);
    } else if (mod3 === 1) {
      grassGeometry.rotateY(Math.PI * 0.25);
    } else {
      grassGeometry.rotateY(Math.PI * 0.75);
    }

    grassClumpGeometries.push(grassGeometry);
  }

  // Merge grass clump geometry
  const grassClumpGeometry =
    BufferGeometryUtils.mergeBufferGeometries(grassClumpGeometries);

  const grassMaterial = new THREE.MeshStandardMaterial({
    map: grassColorTexture,
    aoMap: grassAmbientOcclusionTexture,
    aoMapIntensity: 40.5,
    alphaMap: grassAlphaTexture,
    alphaTest: 0.15,
    normalMap: grassNormalTexture,
    roughnessMap: grassRoughnessTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  grassMaterial.normalScale.set(8.5, 8.5);

  gui
    .add(customUniforms.uWindMovement.value, "x")
    .min(0)
    .max(20)
    .step(0.001)
    .name("windMovementX");
  gui
    .add(customUniforms.uWindMovement.value, "y")
    .min(0)
    .max(20)
    .step(0.001)
    .name("windMovementY");
  gui
    .add(customUniforms.uWindDensity, "value")
    .min(0)
    .max(1.5)
    .step(0.001)
    .name("windDensity");
  gui
    .add(customUniforms.uWindStrength, "value")
    .min(0)
    .max(1.5)
    .step(0.001)
    .name("windStrength");

  grassMaterial.onBeforeCompile = (shader) => {
    // Custom uniforms
    shader.uniforms.uTime = customUniforms.uTime;
    shader.uniforms.uWindMovement = customUniforms.uWindMovement;
    shader.uniforms.uWindDensity = customUniforms.uWindDensity;
    shader.uniforms.uWindStrength = customUniforms.uWindStrength;

    // Definitions
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `
    ${grassVertexDefinitions}

    void main() {
    `
    );

    // Inside main function
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        #include <begin_vertex>
        
        ${grassVertexShader}
    `
    );
  };

  const grass = new THREE.InstancedMesh(
    grassClumpGeometry,
    grassMaterial,
    amount
  );

  grass.updateMatrixWorld();

  // Convert local vectors to world vectors
  const grassWorldPosition = new Float32Array(
    grass.geometry.attributes.position.array.length
  );

  for (
    let i = 0;
    i < grass.geometry.attributes.position.array.length / 3;
    i++
  ) {
    const i3 = i * 3;

    // create vector 3 from position attributes
    const localVector = new THREE.Vector3(
      grass.geometry.attributes.position.array[i3 + 0],
      grass.geometry.attributes.position.array[i3 + 1],
      grass.geometry.attributes.position.array[i3 + 2]
    );

    // convert the vector to world space
    const globalVector = grass.localToWorld(localVector);

    // add the vector data in to a new array
    grassWorldPosition[i3 + 0] = globalVector.x;
    grassWorldPosition[i3 + 1] = globalVector.y;
    grassWorldPosition[i3 + 2] = globalVector.z;
  }

  grassClumpGeometry.setAttribute(
    "aWorldPosition",
    new THREE.BufferAttribute(grassWorldPosition, 3)
  );

  scene.add(grass);

  // Place the grass
  for (let i = 0; i < amount; i++) {
    // Set a random position
    // const position = new THREE.Vector3(
    //   (Math.random() - 0.5) * 0.3 - 0.7,
    //   0.25,
    //   (Math.random() - 0.5) * 0.6 + 0.55
    // );
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3 - 0.7,
      0.25,
      (Math.random() - 0.5) * 0.6 + 0.55
    );

    const matrix = new THREE.Matrix4();
    matrix.setPosition(position);

    grass.setMatrixAt(i, matrix);
  }
};
