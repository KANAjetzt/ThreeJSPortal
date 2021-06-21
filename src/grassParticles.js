import * as THREE from "three";
import { scene } from "./script";
import { gui } from "./script";

export const createGrassParticles = () => {
  // Geometry
  const grassParticleGeometry = new THREE.BufferGeometry();
  const grassParticleCount = 30;
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
};
