objectNormal = vec3(0.0, 1.0, 0.0);
vvNormal = objectNormal;

// When a instanced Mesh is used the instancedMatrix has to be aplied to the position
  vec4 instancedPosition = instanceMatrix * vec4(aWorldPosition, 1.0);
  
  vec2 worldUv = instancedPosition.xy;
  
  vec2 windMovement = uTime * uWindMovement;

  // offset UVs over time
  worldUv += windMovement;

  // generate noise
  float windNoise = noise2d(worldUv * uWindDensity);
  // subtract by .5 so noise is positiv and negativ
  // --> so the wind not only moves from one direction
  windNoise -= 0.5;
  // modify noise strength to set how muche the "wind" invlunces the vertecies
  windNoise *= uWindStrength;

  // offset position on X
  windNoise += instancedPosition.x;

  // combine new worldPosition
  vec3 newWorldPosition = vec3(windNoise, instancedPosition.y, instancedPosition.z);

  // Mix betwenn default wolrd position and new world position based on the Y of the UV
  // So the verticies at the top move and at the bottom not :)
  vec3 newWolrdPositionMixed = mix(instancedPosition.xyz, newWorldPosition, uv.y);

  // Converte new world position to local postion
  vec4 newLocalPosition = inverse(modelMatrix) * vec4(newWolrdPositionMixed, 1.0);
  transformed.xyz = newLocalPosition.xyz;
  /*
  https://stackoverflow.com/questions/42747784/

  So, if you have a point in world coordinate system 
  and want to get it in local coordinate system,
  you just have to invert the first equation:

  Plocal = inv(M) * Pworld;

  Inverse of a matrix in GLSL:
  https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/inverse.xhtml
  */

  
  // vec4 modelPosition = modelMatrix * (instanceMatrix * vec4(position, 1));
  // vec4 modelPosition = modelMatrix * newLocalPosition
  // vec4 viewPosition = viewMatrix * modelPosition;
  // vec4 projectedPosition = projectionMatrix * viewPosition;
  
  // gl_Position = projectedPosition;

  // vUv = uv;
  // vNormal = normal;
  vWindNoise = windNoise;
  // vNewLocalPosition = newLocalPosition;
  // vNewWorldPosition = newWorldPosition;
  vWorldPosition = aWorldPosition;
  // vPosition = position;
