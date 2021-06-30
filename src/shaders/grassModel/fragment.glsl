uniform vec3 uGrassColor;
uniform sampler2D uGroundMask;

varying float vWindNoise;
varying vec2 vUv;
varying vec2 vWorldUv;
varying vec3 vGroundPlaneWorldPosition;
varying vec4 vNewLocalPosition;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

float dither4x4(vec2 position, float brightness) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.0625;
    if (index == 1) limit = 0.5625;
    if (index == 2) limit = 0.1875;
    if (index == 3) limit = 0.6875;
    if (index == 4) limit = 0.8125;
    if (index == 5) limit = 0.3125;
    if (index == 6) limit = 0.9375;
    if (index == 7) limit = 0.4375;
    if (index == 8) limit = 0.25;
    if (index == 9) limit = 0.75;
    if (index == 10) limit = 0.125;
    if (index == 11) limit = 0.625;
    if (index == 12) limit = 1.0;
    if (index == 13) limit = 0.5;
    if (index == 14) limit = 0.875;
    if (index == 15) limit = 0.375;
  }

  return brightness < limit ? 0.0 : 1.0;
}

vec3 dither4x4(vec2 position, vec3 color) {
  return color * dither4x4(position, luma(color));
}

vec4 dither4x4(vec2 position, vec4 color) {
  return vec4(color.rgb * dither4x4(position, luma(color)), 1.0);
}

void main() {

  // flip texture
  vec2 newUv = vWorldUv;
  newUv = 1.0 - newUv;

  // Offset UV
  newUv += 1.0;
  
  // scale UV
  newUv *= 0.25;

  vec4 groundMask = texture2D(uGroundMask, newUv);

  if(groundMask.r <= 0.15) {
    discard;
  }

  // vec4 testColor = vNewLocalPosition;
  // vec4 testColor = vec4(vNewLocalPosition.y,vNewLocalPosition.y,vNewLocalPosition.y, 1.0);
  // vec4 testColor = vec4(vWindNoise, vWindNoise, vWindNoise, 1.0);
  // vec4 testColor = vec4(vWorldUv, 0.0, 1.0);
  // vec4 testColor = vec4(vGroundPlaneUv, 0.0, 1.0);
  vec4 testColor = vec4(newUv, 0.0, 1.0);
  // vec4 testColor = vec4(vGroundPlaneWorldPosition.xz, 0.0, 1.0);
  // vec4 testColor = vec4(groundMask.rrr, 1.0);
  


  vec4 baseColor = vec4(vUv.y * uGrassColor.r, vUv.y * uGrassColor.g,vUv.y * uGrassColor.b, 1.0);
  vec4 ditherColor = dither4x4(gl_FragCoord.xy, baseColor);

  vec4 finalColor = mix(ditherColor, baseColor, step(0.005, vNewLocalPosition.y));

  // Alpha test
  // if(finalColor.g <= 0.15)
  //   discard;

  // gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
  gl_FragColor = baseColor;
}