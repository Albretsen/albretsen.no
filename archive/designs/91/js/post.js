// Living Town: post-processing. HDR scene -> bloom -> tilt-shift depth of field + grade -> screen.
// The depth of field is what makes the town read as a miniature: a shallow focus plane that
// can be pulled to whoever the visitor clicks.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// One full-screen pass between the scene and the depth of field. It adds the bloom to the scene
// colour (what UnrealBloomPass's own additive blend did, but into a plain target instead of back
// into the multisampled scene buffer, which made the GPU load, blend and resolve 4x MSAA at full
// size every frame), and it works out each pixel's lens blur and linear depth once, so the
// 30-tap gather below reads one texel per tap instead of decoding the depth buffer twice.
const PREP_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tScene, tBloom, tDepth;
uniform float uBloom, uNear, uFar, uFocus, uAperture;
in vec2 vUv;
layout(location = 0) out vec4 oColor;
layout(location = 1) out vec4 oCoc;
float linDepth(float d){ float z = d * 2. - 1.; return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
void main(){
  vec3 c = texture(tScene, vUv).rgb;
  if (uBloom > .5) { vec4 b = texture(tBloom, vUv); c += b.rgb * b.a; }   // additive blend, src * srcAlpha + dst
  oColor = vec4(c, 1.);
  float z = linDepth(texture(tDepth, vUv).x);
  oCoc = vec4(uAperture * abs(z - uFocus) / max(z, .001), z, 0., 1.);
}`;
const PREP_VERT = /* glsl */`
in vec3 position; in vec2 uv; out vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

const FINAL_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tColor, tDepth, tCoc;
uniform vec2 uRes;
uniform float uNear, uFar, uFocus, uAperture, uMaxBlur, uExposure, uTime, uGrain, uVignette, uTilt, uTaps;
uniform vec3 uLift, uGain; uniform float uDebugNaN;
uniform vec3 uOff[40];   // golden-angle spiral, worked out once per tap count: (cos, sin) * r, r
varying vec2 vUv;

float linDepth(float d){ float z = d * 2. - 1.; return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
// the tilt: a soft band, blur grows toward the top and bottom of the frame
float bandAt(vec2 uv){ return smoothstep(.18, .5, abs(uv.y - .46)) * uTilt; }
#if PREP
// the prep pass stored (lens blur, linear depth) per pixel, sampled nearest like the depth texture
vec2 cz(vec2 uv){ return texture2D(tCoc, uv).xy; }
#else
vec2 cz(vec2 uv){ float z = linDepth(texture2D(tDepth, uv).x); return vec2(uAperture * abs(z - uFocus) / max(z, .001), z); }
#endif
float cocOf(vec2 s, vec2 uv){ return clamp(max(s.x, bandAt(uv) * uMaxBlur), 0., uMaxBlur); }
vec3 aces(vec3 x){ const float a = 2.51, b = .03, c = 2.43, d = .59, e = .14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0., 1.); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
float h12(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 px = 1. / uRes;
  vec2 s0 = cz(vUv);
  float c0 = cocOf(s0, vUv);
  float z0 = s0.y;
  vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.;
  if (uDebugNaN > 0.5) { vec3 cc = acc; if (any(isnan(cc)) || any(isinf(cc))) { gl_FragColor = vec4(1.,0.,1.,1.); return; } if (max(cc.r, max(cc.g, cc.b)) > 50.) { gl_FragColor = vec4(0.,1.,0.,1.); return; } }
  if (c0 > .6 || uTilt > 0.) {
    for (int i = 1; i < 40; i++) {
      if (float(i) >= uTaps) break;
      float r = uOff[i].z;
      vec2 o = uOff[i].xy * uMaxBlur;
      vec2 uv = vUv + o * px;
      vec2 ss = cz(uv);
      float cs = cocOf(ss, uv);
      float zs = ss.y;
      float d = r * uMaxBlur;
      // a sample counts if its own blur reaches us, or if it is behind us and our blur reaches it
      // a sample in front of us blurs over us by its own amount; one behind us only as far as our own blur reaches
      // (one smoothstep on the chosen blur: the same as mixing two by a 0/1 step)
      float w = smoothstep(d - 1.5, d + .5, zs >= z0 + .6 ? min(cs, c0) : cs);
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
    // the prep pass needs float colour targets; without them the gather decodes depth itself, as before
    this.prep = renderer.extensions.has('EXT_color_buffer_float');
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
      tColor: { value: this.prep ? this.mid.textures[0] : this.rt.texture }, tDepth: { value: this.depth }, tCoc: { value: this.prep ? this.mid.textures[1] : null }, uRes: { value: size.clone() },
      uNear: { value: 1 }, uFar: { value: 3000 }, uFocus: { value: 60 }, uAperture: { value: 14 }, uMaxBlur: { value: 9 },
      uExposure: { value: 1 }, uTime: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.35 }, uTilt: { value: 0 },
      uTaps: { value: taps }, uOff: { value: Array.from({ length: 40 }, () => new THREE.Vector3()) }, uLift: { value: new THREE.Color(0, 0, 0) }, uDebugNaN: { value: new URLSearchParams(location.search).has('nan') ? 1 : 0 }, uGain: { value: new THREE.Color(1, 1, 1) },
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.U, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: FINAL_FRAG, defines: { PREP: this.prep ? 1 : 0 },
    }));
    if (this.prep) {
      const U = this.U;
      this.PU = { tScene: { value: this.rt.texture }, tBloom: { value: this.bloom.renderTargetsHorizontal[0].texture }, tDepth: U.tDepth, uBloom: { value: 1 },
        uNear: U.uNear, uFar: U.uFar, uFocus: U.uFocus, uAperture: U.uAperture };
      this.prepQuad = new FullScreenQuad(new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3, uniforms: this.PU, depthTest: false, depthWrite: false,
        vertexShader: PREP_VERT, fragmentShader: PREP_FRAG,
      }));
    }
    this.quad.frustumCulled = false;
    this._spiral();
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  _makeTarget(size) {
    // a fresh target on every resize: resizing a multisampled target with a depth texture in place is not reliable
    if (this.rt) { this.rt.dispose(); this.depth.dispose(); }
    this.depth = new THREE.DepthTexture(size.x, size.y);
    this.depth.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: this.msaa, depthTexture: this.depth, depthBuffer: true });
    if (this.prep) {
      if (this.mid) this.mid.dispose();
      this.mid = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, count: 2, depthBuffer: false });
      const cz = this.mid.textures[1];
      cz.type = THREE.FloatType; cz.format = THREE.RGFormat;
      cz.minFilter = cz.magFilter = THREE.NearestFilter;   // like the depth texture it replaces
      for (const t of this.mid.textures) t.generateMipmaps = false;
    }
    if (this.U) {
      this.U.tColor.value = this.prep ? this.mid.textures[0] : this.rt.texture; this.U.tDepth.value = this.depth;
      if (this.prep) { this.U.tCoc.value = this.mid.textures[1]; this.PU.tScene.value = this.rt.texture; }
    }
  }

  setSize() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    if (size.x === this.rt.width && size.y === this.rt.height) return;
    this._makeTarget(size);
    this.U.uRes.value.copy(size);
    this.bloom.setSize(Math.round(size.x * this.bloomScale), Math.round(size.y * this.bloomScale));
  }

  // the gather's tap offsets: same golden-angle spiral the shader used to work out per pixel per tap
  _spiral() {
    const n = this.U.uTaps.value, GA = 2.39996323;
    this._taps = n;
    this.U.uOff.value.forEach((v, i) => { const r = Math.sqrt(i / n), th = i * GA; v.set(Math.cos(th) * r, Math.sin(th) * r, r); });
  }

  render(scene, camera, dt) {
    const r = this.renderer;
    if (this.U.uTaps.value !== this._taps) this._spiral();
    this.U.uNear.value = camera.near; this.U.uFar.value = camera.far;
    this.U.uTime.value += dt;
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, camera);
    const bloomOn = this.bloom.strength > 0.01;
    if (!this.prep) {
      if (bloomOn) this.bloom.render(r, null, this.rt, dt, false);
    } else {
      if (bloomOn) this._bloom(r);
      this.PU.uBloom.value = bloomOn ? 1 : 0;
      r.setRenderTarget(this.mid);
      this.prepQuad.render(r);
    }
    r.setRenderTarget(null);
    r.render(this.qScene, this.qCam);
  }

  // UnrealBloomPass.render without its last step (the additive blend back into the scene target):
  // bright pass, five blurred mips, composite into renderTargetsHorizontal[0]. The prep pass adds it.
  _bloom(r) {
    const B = this.bloom, q = B.fsQuad;
    r.getClearColor(B._oldClearColor);
    const oldAlpha = r.getClearAlpha(), oldAuto = r.autoClear;
    r.autoClear = false;
    r.setClearColor(B.clearColor, 0);
    B.highPassUniforms.tDiffuse.value = this.rt.texture;
    B.highPassUniforms.luminosityThreshold.value = B.threshold;
    q.material = B.materialHighPassFilter;
    r.setRenderTarget(B.renderTargetBright); r.clear(); q.render(r);
    let input = B.renderTargetBright;
    for (let i = 0; i < B.nMips; i++) {
      const m = B.separableBlurMaterials[i];
      q.material = m;
      m.uniforms.colorTexture.value = input.texture;
      m.uniforms.direction.value = UnrealBloomPass.BlurDirectionX;
      r.setRenderTarget(B.renderTargetsHorizontal[i]); r.clear(); q.render(r);
      m.uniforms.colorTexture.value = B.renderTargetsHorizontal[i].texture;
      m.uniforms.direction.value = UnrealBloomPass.BlurDirectionY;
      r.setRenderTarget(B.renderTargetsVertical[i]); r.clear(); q.render(r);
      input = B.renderTargetsVertical[i];
    }
    q.material = B.compositeMaterial;
    B.compositeMaterial.uniforms.bloomStrength.value = B.strength;
    B.compositeMaterial.uniforms.bloomRadius.value = B.radius;
    B.compositeMaterial.uniforms.bloomTintColors.value = B.bloomTintColors;
    r.setRenderTarget(B.renderTargetsHorizontal[0]); r.clear(); q.render(r);
    r.setClearColor(B._oldClearColor, oldAlpha);
    r.autoClear = oldAuto;
  }
}
