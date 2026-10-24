// Living Town: post-processing. HDR scene -> bloom -> tilt-shift depth of field + grade -> screen.
// The depth of field is what makes the town read as a miniature: a shallow focus plane that
// can be pulled to whoever the visitor clicks.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const FINAL_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tColor, tDepth;
uniform vec2 uRes;
uniform float uNear, uFar, uFocus, uAperture, uMaxBlur, uExposure, uTime, uGrain, uVignette, uTilt, uTaps;
uniform vec3 uLift, uGain; uniform float uDebugNaN;
varying vec2 vUv;

float linDepth(float d){ float z = d * 2. - 1.; return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
float cocAt(vec2 uv){
  float z = linDepth(texture2D(tDepth, uv).x);
  float c = uAperture * abs(z - uFocus) / max(z, .001);
  // the tilt: a soft band, blur grows toward the top and bottom of the frame
  float band = smoothstep(.18, .5, abs(uv.y - .46)) * uTilt;
  return clamp(max(c, band * uMaxBlur), 0., uMaxBlur);
}
vec3 aces(vec3 x){ const float a = 2.51, b = .03, c = 2.43, d = .59, e = .14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0., 1.); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
float h12(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 px = 1. / uRes;
  float c0 = cocAt(vUv);
  float z0 = linDepth(texture2D(tDepth, vUv).x);
  vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.;
  if (uDebugNaN > 0.5) { vec3 cc = acc; if (any(isnan(cc)) || any(isinf(cc))) { gl_FragColor = vec4(1.,0.,1.,1.); return; } if (max(cc.r, max(cc.g, cc.b)) > 50.) { gl_FragColor = vec4(0.,1.,0.,1.); return; } }
  if (c0 > .6 || uTilt > 0.) {
    const float GA = 2.39996323;
    for (int i = 1; i < 40; i++) {
      if (float(i) >= uTaps) break;
      float r = sqrt(float(i) / uTaps);
      float th = float(i) * GA;
      vec2 o = vec2(cos(th), sin(th)) * r * uMaxBlur;
      vec2 uv = vUv + o * px;
      float cs = cocAt(uv);
      float zs = linDepth(texture2D(tDepth, uv).x);
      float d = r * uMaxBlur;
      // a sample counts if its own blur reaches us, or if it is behind us and our blur reaches it
      // a sample in front of us blurs over us by its own amount; one behind us only as far as our own blur reaches
      float behind = step(z0 + .6, zs);
      float w = mix(smoothstep(d - 1.5, d + .5, cs), smoothstep(d - 1.5, d + .5, min(cs, c0)), behind);
      acc += texture2D(tColor, uv).rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  if (any(isnan(col)) || any(isinf(col))) col = vec3(0.);   // never let one bad texel smear through the gather
  col *= uExposure;
  col = aces(col);
  col = col * uGain + uLift * (1. - col);
  vec2 q = vUv - .5;
  col *= 1. - uVignette * dot(q, q) * 1.6;
  col = toSRGB(col);
  col += (h12(vUv * uRes + fract(uTime) * 91.7) - .5) * uGrain;
  gl_FragColor = vec4(col, 1.);
}`;

export class Post {
  constructor(renderer, { msaa = 4, taps = 28, bloomScale = 0.5 } = {}) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.msaa = msaa;
    this._makeTarget(size);
    this.bloomScale = bloomScale;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x * bloomScale, size.y * bloomScale), 0.6, 0.55, 1.0);
    // Guard the bloom input. Bloom blurs down to a few pixels across, so one NaN or Inf texel (a bad
    // pow() in a shader, a half-float overflow next to a point light) becomes NaN over the whole frame
    // and the town vanishes for that frame. Drop non-finite texels and cap the rest well above anything
    // the scene actually produces, so the result is unchanged when the input is sane.
    const hp = this.bloom.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader.replace('vec4 texel = texture2D( tDiffuse, vUv );',
      'vec4 texel = texture2D( tDiffuse, vUv );\n\t\t\ttexel.rgb = (any(isnan(texel.rgb)) || any(isinf(texel.rgb))) ? vec3(0.) : min(texel.rgb, vec3(256.));');
    hp.needsUpdate = true;
    this.U = {
      tColor: { value: this.rt.texture }, tDepth: { value: this.depth }, uRes: { value: size.clone() },
      uNear: { value: 1 }, uFar: { value: 3000 }, uFocus: { value: 60 }, uAperture: { value: 14 }, uMaxBlur: { value: 9 },
      uExposure: { value: 1 }, uTime: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.35 }, uTilt: { value: 0 },
      uTaps: { value: taps }, uLift: { value: new THREE.Color(0, 0, 0) }, uDebugNaN: { value: new URLSearchParams(location.search).has('nan') ? 1 : 0 }, uGain: { value: new THREE.Color(1, 1, 1) },
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.U, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: FINAL_FRAG,
    }));
    this.quad.frustumCulled = false;
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  _makeTarget(size) {
    // a fresh target on every resize: resizing a multisampled target with a depth texture in place is not reliable
    if (this.rt) { this.rt.dispose(); this.depth.dispose(); }
    this.depth = new THREE.DepthTexture(size.x, size.y);
    this.depth.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: this.msaa, depthTexture: this.depth, depthBuffer: true });
    if (this.U) { this.U.tColor.value = this.rt.texture; this.U.tDepth.value = this.depth; }
  }

  setSize() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    if (size.x === this.rt.width && size.y === this.rt.height) return;
    this._makeTarget(size);
    this.U.uRes.value.copy(size);
    this.bloom.setSize(Math.round(size.x * this.bloomScale), Math.round(size.y * this.bloomScale));
  }

  render(scene, camera, dt) {
    const r = this.renderer;
    this.U.uNear.value = camera.near; this.U.uFar.value = camera.far;
    this.U.uTime.value += dt;
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, camera);
    if (this.bloom.strength > 0.01) this.bloom.render(r, null, this.rt, dt, false);
    r.setRenderTarget(null);
    r.render(this.qScene, this.qCam);
  }
}
