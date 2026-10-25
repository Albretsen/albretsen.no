// Living Town sound: renders recipes off the main thread, so the town keeps its frame rate while the
// sound is made. The recipes only fill sample arrays; here a stand-in for OfflineAudioContext gives them
// a buffer to fill, and the samples go back to the page (transferred, not copied).
// The page sends the recipe modules' URLs (the import map does not reach a worker).
class Buf {
  constructor(c, n, sr) { this.numberOfChannels = c; this.length = n; this.sampleRate = sr; this.ch = Array.from({ length: c }, () => new Float32Array(n)); }
  get duration() { return this.length / this.sampleRate; }
  getChannelData(c) { return this.ch[c]; }
  copyToChannel(src, c, at = 0) { this.ch[c].set(src.subarray(0, this.length - at), at); }
}
class Off { constructor() {} createBuffer(c, n, sr) { return new Buf(c, n, sr); } }

let recipes = null;
onmessage = async ({ data }) => {
  if (data.urls) { recipes = Object.assign({}, ...(await Promise.all(data.urls.map((u) => import(u)))).map((m) => m.RECIPES)); postMessage({ ready: true }); return; }
  const { id, name, seed, sampleRate } = data;
  try {
    const b = await recipes[name].render({ OfflineAudioContext: Off, sampleRate, seed });
    postMessage({ id, sampleRate: b.sampleRate, channels: b.ch }, b.ch.map((c) => c.buffer));
  } catch (e) { postMessage({ id, error: String(e) }); }
};
