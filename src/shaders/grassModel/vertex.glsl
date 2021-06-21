attribute vec3 aWorldPosition;

uniform float uTime;
uniform float uWindDensity;
uniform float uWindStrength;
uniform vec2 uWindMovement;

varying float vWindNoise;
varying vec2 vUv;
varying vec4 vNewLocalPosition;

//	Classic Noise 
//	by Stefan Gustavson
//
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){
    return mod(((x*34.0)+1.0)*x, 289.0);
}

float noise2d(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {

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
  vec3 newWolrdPositionMixed = mix(instancedPosition.xyz, newWorldPosition, step(0.6, uv.y));

  // Converte new world position to local postion
  vec4 newLocalPosition = inverse(modelMatrix) * vec4(newWolrdPositionMixed, 1.0);
  newLocalPosition.y -= 0.005;
  
  vec4 modelPosition = modelMatrix * newLocalPosition;
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;

  gl_Position = projectionPosition;

  vNewLocalPosition = newLocalPosition;
  vWindNoise = windNoise;
  vUv = uv;
}