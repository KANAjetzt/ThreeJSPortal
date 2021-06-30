uniform vec3 uColor;
uniform sampler2D uGroundMask;

varying vec2 vUv;

void main() {

  vec2 newUv = vUv;
  newUv.x = 1.0 - newUv.x;

  vec4 groundMask = texture2D(uGroundMask, newUv);

  gl_FragColor = vec4(uColor * 0.6, 1.0);
  // gl_FragColor = vec4( newUv, 0.0, 1.0);
  // gl_FragColor = groundMask;
}