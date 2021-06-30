import * as THREE from "three";

// Convert local vectors to world vectors

export const localToWorld = (mesh) => {
  const worldPosition = new Float32Array(
    mesh.geometry.attributes.position.array.length
  );

  for (let i = 0; i < mesh.geometry.attributes.position.array.length / 3; i++) {
    const i3 = i * 3;

    // create vector 3 from position attributes
    const localVector = new THREE.Vector3(
      mesh.geometry.attributes.position.array[i3 + 0],
      mesh.geometry.attributes.position.array[i3 + 1],
      mesh.geometry.attributes.position.array[i3 + 2]
    );

    // convert the vector to world space
    const globalVector = mesh.localToWorld(localVector);

    // add the vector data in to a new array
    worldPosition[i3 + 0] = globalVector.x;
    worldPosition[i3 + 1] = globalVector.y;
    worldPosition[i3 + 2] = globalVector.z;
  }

  return worldPosition;
};
