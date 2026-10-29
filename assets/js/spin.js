/* ============================================================
   TURNTABLES — the real cup, turned. One engine drives the hero, the
   product page cup, the cup in "How we blend" and the cups on the
   menu cards.

   The cup is one 4K photograph, not a model and not a stack of frames.
   Its body is read into a strip by longitude and height with the studio
   light divided out, so any angle is: for each pixel on the body, look
   up longitude minus the angle and put the light back. The smoothie
   heaped under the lid turns the same way, round a strip of its own; the
   clear lid, its light and the shadow stay as photographed, as a real
   lid's reflections would; the straw's lean swings round. A small tilt up and down
   (MAX_TILT) carries each layer on a stand-in shape, so the cup leans
   towards you and away like the old 3D one. Every flavour is its own
   photograph of the same cup (300 to 440 KB of textures each, about
   110 KB at the half size the menu's cards use), loaded when a cup of
   that flavour is first wanted. Built by blendmandu-3d,
   tools/wrap_build.py and tools/wrap_export.py, into assets/img/cup/.

   One WebGL canvas, never in the page, draws every cup; each turntable
   copies its picture onto a canvas laid over its poster. Without WebGL
   the posters stay, one still per flavour.
   ============================================================ */
(() => {
  const SRC = document.currentScript.src;
  // ?v= carried over from this script's own URL: /assets/ is cached for a
  // year, and the build's hash covers the cup's files, so a re-export is a new URL
  const asset = name => new URL(`../img/cup/${name}`, SRC).href + new URL(SRC).search;
  const posterURL = id => asset(`${id}.webp`);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const net = navigator.connection || {};
  // data saver or 2G (the old WebGL cups' cut-off): nothing turns on its own
  // and the menu cards keep their photo
  const SAVE = !!net.saveData || /2g$/.test(net.effectiveType || '');
  // a phone short of memory, or a slow link: no fetching ahead, fewer sets kept
  const LOW = SAVE || /3g$/.test(net.effectiveType || '') || (navigator.deviceMemory || 8) <= 4;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // The photograph is one view: tilted further than this the lid and the base
  // start to come apart, so the cup tilts this far and no further, either way
  const MAX_TILT = 10;
  const chase = (cur, to, tau, dt) => cur + (to - cur) * (1 - Math.exp(-dt / tau));
  const within = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

  /* ---------- the shader: wrap_export.py's render(), on the GPU ---------- */
  const VERT = `attribute vec2 p; varying vec2 vUv;
void main() { vUv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D uStrip, uTop, uMaps, uStraw, uMound, uMStrip;
uniform vec4 uBox, uStrawBox, uKf, uLidA, uLidB, uMBox;
uniform vec3 uMoundS;
uniform vec3 uRfit;
uniform vec2 uCfit, uBody, uPivot, uTilt, uP0, uVh, uV0h;
uniform float uKhi, uTheta, uTiltC, uStrawK;
const float PI = 3.14159265;

vec3 dec(vec3 c) { return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(.04045, c)); }
vec3 enc(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
float cxAt(float u) { return uCfit.x * (u - 1600.) / 1000. + uCfit.y; }
float radAt(float u) { float t = (u - 1600.) / 1000.; return (uRfit.x * t + uRfit.y) * t + uRfit.z; }
float kfAt(float u) { return clamp(uKf.x + (u - uKf.y) * uKf.z, uKf.w, uKhi); }
// the whole cup's radius at each height: the lid's outline over the rim, the body below
float outlineAt(float u) {
  if (u < uLidA.x || u > uBody.x + uBody.y) return 0.;
  if (u < uLidA.y) { float t = (uLidA.y - u) / (uLidA.y - uLidA.x); return uLidA.z * sqrt(max(1. - t * t, 0.)) + uLidB.w; }
  if (u < uLidA.w) return uLidA.z + (uLidB.x - uLidA.z) * (u - uLidA.y) / (uLidA.w - uLidA.y) + uLidB.w;
  if (u < uLidB.y) return uLidB.x + uLidB.w;
  if (u < uLidB.z) return uLidB.x + uLidB.w + (radAt(uLidB.z) - uLidB.x - uLidB.w) * (u - uLidB.y) / (uLidB.z - uLidB.y);
  return radAt(u);
}
// The point a pixel shows on a stand-in shape, the cup tilted about its middle:
// its height u, across X and towards the camera Z. Off the shape Z is 0, a flat
// card through the axis. At no tilt it lands exactly where the photograph had it.
vec3 solve(vec2 xy, bool whole) {
  float c = uTilt.x, s = uTilt.y, u = xy.y, Z = 0., X = 0., up = u;
  for (int i = 0; i < 8; i++) {
    up = uTiltC + (u - uTiltC) * c + Z * s;
    X = xy.x - cxAt(up);
    float r = whole ? outlineAt(u) : radAt(u);
    float q = X / max(r, 1e-3);
    Z = r > 0. ? r * sqrt(clamp(1. - q * q, 0., 1.)) : 0.;
    up = xy.y - kfAt(up) * (Z * c - (u - uTiltC) * s);
    u = uTiltC + (up - uTiltC - Z * s) / c;
  }
  up = uTiltC + (u - uTiltC) * c + Z * s;
  return vec3(u, xy.x - cxAt(up), Z);
}
// where that point was in the photograph, as a texture coordinate
vec2 photoUv(vec3 p) { return (vec2(cxAt(p.x) + p.y, p.x + kfAt(p.x) * p.z) - uBox.xy) / uBox.zw; }

void main() {
  vec2 xy = uBox.xy + vUv * uBox.zw;                 // in the photograph's pixels

  // the body: the strip turned on its rings; the light and outline where the photograph had them
  vec3 b = solve(xy, false);
  vec4 mp = texture2D(uMaps, photoUv(b));
  float bA = mp.r, S = mp.g * 2., u = b.x;
  float phi = asin(clamp(b.y / radAt(u), -1., 1.));
  vec3 alb = dec(texture2D(uStrip, vec2((phi - uTheta + PI) / (2. * PI), (u - uBody.x + .5) / uBody.y)).rgb);
  vec3 body = alb * S * bA;

  // the straw: its lean swung round with the turn, tilted with the cup
  vec2 q = xy - uP0;
  float along = dot(q, uVh) * uStrawK, across = dot(q, vec2(-uVh.y, uVh.x));
  vec2 st = (uPivot + along * uV0h + across * vec2(-uV0h.y, uV0h.x) - uStrawBox.xy) / uStrawBox.zw;
  vec3 sc = vec3(0.);
  float sa = 0.;
  if (st.x > 0. && st.x < 1. && st.y > 0. && st.y < 1.) {
    sc = dec(texture2D(uStraw, vec2(st.x * .5, st.y)).rgb);
    sa = texture2D(uStraw, vec2(.5 + st.x * .5, st.y)).r;
  }
  vec3 under = sc + body * (1. - sa);
  float underA = sa + bA * (1. - sa);

  // the lid, the rim under its lip and the shadow, carried on the whole cup's outline
  vec3 o = solve(xy, true);
  vec2 tuv = photoUv(o);

  // the smoothie heaped under the lid: its outline where the photograph had it,
  // its surface turned with the cup round its own unwrapped strip
  float rm = max(uMoundS.z * sqrt(clamp(1. - pow((uMoundS.y - o.x) / (uMoundS.y - uMoundS.x), 2.), 0., 1.)), 1.);
  float mph = asin(clamp(o.y / rm, -1., 1.));
  vec2 mu = (uBox.xy + tuv * uBox.zw - uMBox.xy) / uMBox.zw;
  float hA = texture2D(uMound, clamp(mu, 0., 1.)).r * step(0., mu.x) * step(mu.x, 1.) * step(0., mu.y) * step(mu.y, 1.);
  vec3 hc = dec(texture2D(uMStrip, vec2((mph - uTheta + PI) / (2. * PI), (o.x - uMoundS.x) / (uMoundS.y - uMoundS.x))).rgb);
  under = hc * hA + under * (1. - hA);
  underA = hA + underA * (1. - hA);

  // What turns is lit in linear light; the lid, the rim band and the shadow were
  // solved in sRGB, the space the page lays this canvas over itself in, so over
  // the cream they give back the photograph exactly. Layer them there.
  float tA = texture2D(uMaps, tuv).b;
  vec3 tc = texture2D(uTop, tuv).rgb;                // sRGB, premultiplied
  vec3 us = enc(clamp(under / max(underA, 1e-4), 0., 1.)) * underA;
  vec3 C = clamp(tc + us * (1. - tA), 0., 1.);
  float A = tA + underA * (1. - tA);
  gl_FragColor = vec4(C, max(clamp(A, 0., 1.), max(C.r, max(C.g, C.b))));
}`;

  /* ---------- the renderer, shared by every turntable on the page ----------
     Each flavour is its own photograph, built into its own set of textures
     (assets/img/cup/<id>/): loaded when a cup of that flavour is first wanted,
     full size for the hero and a product page, half size (sm/) for the menu's
     cards, which are a few hundred pixels across. */
  const R = { ok: false, kits: {} };
  let rendering = null;
  const loadImg = name => new Promise((ok, no) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => ok(im);
    im.onerror = no;
    im.src = asset(name);
  });
  const LAYERS = ['strip', 'top', 'maps', 'straw', 'mound', 'mstrip'];
  function renderer() {
    return (rendering ||= (async () => {
      const cv = document.createElement('canvas');
      const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
      const gl = cv.getContext('webgl2', opts) || cv.getContext('webgl', opts);
      if (!gl) return null;
      const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      if (!hp || !hp.precision) return null;
      const geo = await fetch(asset('wrap.json')).then(r => r.json());
      Object.assign(R, { cv, gl, geo: geo.flavours, gl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext });
      // a lost context keeps every turntable's last picture; a restored one loads its textures again
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); R.ok = false; });
      cv.addEventListener('webglcontextrestored', () => { R.kits = {}; R.ok = setup(); wake(); });
      R.ok = setup();
      return R.ok ? R : null;
    })().catch(() => null));
  }
  function setup() {
    const { gl } = R;
    const shader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, 'p');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    // the images are data as much as colour: no colour management, no premultiplying
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    R.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const U = name => gl.getUniformLocation(prog, name);
    LAYERS.forEach((n, i) => gl.uniform1i(U(`u${n === 'mstrip' ? 'MStrip' : n[0].toUpperCase() + n.slice(1)}`), i));
    R.u = Object.fromEntries(['uTheta', 'uTilt', 'uP0', 'uVh', 'uV0h', 'uStrawK', 'uBox', 'uStrawBox', 'uKf', 'uKhi',
      'uCfit', 'uRfit', 'uBody', 'uPivot', 'uTiltC', 'uLidA', 'uLidB', 'uMoundS', 'uMBox'].map(n => [n, U(n)]));
    R.bound = '';
    return true;
  }
  /* one flavour's textures, at one size: a promise, made once */
  function kit(id, small) {
    const key = `${id}${small ? '/sm' : ''}`;
    return (R.kits[key] ||= (async () => {
      const imgs = await Promise.all(LAYERS.map(n => loadImg(`${key}/${n}.webp`)));
      const { gl, gl2, aniso } = R;
      const tex = imgs.map((im, i) => {
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        const repeat = i === 0 || i === 5, want = i !== 3;           // the strips wrap round; the straw goes without mipmaps
        // WebGL 1 mipmaps only power-of-two sizes: the strips are, the rest go without
        const mip = want && (gl2 || (!(im.width & (im.width - 1)) && !(im.height & (im.height - 1))));
        if (mip) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // the body's edges squeeze the strip sideways: anisotropy keeps them sharp
        if (mip && aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        return t;
      });
      R.bound = '';
      if (!small) evict(key);
      R.kits[key].ready = { tex, geo: R.geo[id], used: performance.now() };
      wake();
      return R.kits[key].ready;
    })());
  }
  const kitReady = (id, small) => { const k = R.kits[`${id}${small ? '/sm' : ''}`]; return k && k.ready; };
  /* Textures sit in graphics memory (a full set is about 80 MB with its mipmaps): keep the
     few in use, and let the least recently drawn go when another arrives. A turntable that
     wants one back simply loads it again, from the cache. */
  const KEEP = LOW ? 2 : 3;
  function evict(keepKey) {
    const live = Object.entries(R.kits).filter(([key, k]) => k.ready && !key.endsWith('/sm') && key !== keepKey);
    live.sort((a, b) => a[1].ready.used - b[1].ready.used);
    while (live.length >= KEEP) {
      const [key, k] = live.shift();
      k.ready.tex.forEach(t => R.gl.deleteTexture(t));
      delete R.kits[key];
      if (R.bound === key) R.bound = '';
    }
  }
  /* bind a flavour's textures and geometry, unless they are bound already */
  function bind(key, k) {
    const { gl, u } = R;
    if (R.bound === key) return;
    R.bound = key;
    k.tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    const g = k.geo, [bx0, by0, bx1, by1] = g.box, [sx0, sy0, sx1, sy1] = g.straw, [mx0, my0, mx1, my1] = g.moundbox;
    gl.uniform4f(u.uBox, bx0, by0, bx1 - bx0, by1 - by0);
    gl.uniform4f(u.uStrawBox, sx0, sy0, sx1 - sx0, sy1 - sy0);
    gl.uniform4f(u.uKf, ...g.kf.slice(0, 4));
    gl.uniform1f(u.uKhi, g.kf[4]);
    gl.uniform2f(u.uCfit, ...g.cfit);
    gl.uniform3f(u.uRfit, ...g.rfit);
    gl.uniform2f(u.uBody, ...g.body);
    gl.uniform2f(u.uPivot, ...g.pivot);
    gl.uniform1f(u.uTiltC, g.tiltc);
    gl.uniform4f(u.uLidA, ...g.lid.slice(0, 4));
    gl.uniform4f(u.uLidB, ...g.lid.slice(4, 8));
    gl.uniform3f(u.uMoundS, ...g.mound);
    gl.uniform4f(u.uMBox, mx0, my0, mx1 - mx0, my1 - my0);
  }
  /* draw a cup at its angle in the shared canvas, then copy it onto the turntable's
     own; false while its flavour's textures are still on their way */
  function paint(tt) {
    const key = `${tt.id}${tt.small ? '/sm' : ''}`;
    const k = kitReady(tt.id, tt.small);
    if (!k) { kit(tt.id, tt.small); return false; }
    const { gl, cv, u } = R, geo = k.geo;
    k.used = performance.now();
    bind(key, k);
    const w = Math.round(tt.dw), h = Math.round(tt.dh);
    if (cv.width < w || cv.height < h) {
      cv.width = Math.max(cv.width, w);
      cv.height = Math.max(cv.height, h);
    }
    const th = ((tt.angle % 360) + 360) % 360 * Math.PI / 180;
    const tau = clamp(tt.tilt, -MAX_TILT, MAX_TILT) * Math.PI / 180;
    const c = Math.cos(tau), s = Math.sin(tau);
    // the straw: where it goes through the lid and which way it points, on the page
    // and in the photograph. It leans left at 0, towards you at 90, right at 180.
    const kf = v => clamp(geo.kf[0] + (v - geo.kf[1]) * geo.kf[2], geo.kf[3], geo.kf[4]);
    const cxAt = v => geo.cfit[0] * (v - 1600) / 1000 + geo.cfit[1];
    const project = (X, v, Z) => {
      const up = geo.tiltc + (v - geo.tiltc) * c + Z * s;
      return [cxAt(up) + X, up + kf(up) * (Z * c - (v - geo.tiltc) * s)];
    };
    const L = 500, lean = geo.lean, [px, py] = geo.pivot, X0 = px - cxAt(py);
    const p0 = project(X0, py, 0);
    const p1 = project(X0 - L * Math.sin(lean) * Math.cos(th), py - L * Math.cos(lean), L * Math.sin(lean) * Math.sin(th));
    const vx = p1[0] - p0[0], vy = p1[1] - p0[1], vl = Math.hypot(vx, vy);
    gl.viewport(0, 0, w, h);
    gl.uniform1f(u.uTheta, th);
    gl.uniform2f(u.uTilt, c, s);
    gl.uniform2f(u.uP0, p0[0], p0[1]);
    gl.uniform2f(u.uVh, vx / vl, vy / vl);
    gl.uniform2f(u.uV0h, -Math.sin(lean), -Math.cos(lean));
    gl.uniform1f(u.uStrawK, L / vl);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    tt.ctx.clearRect(0, 0, tt.c.width, tt.c.height);
    // the viewport is the bottom left corner of the shared canvas
    tt.ctx.drawImage(cv, 0, cv.height - h, w, h, Math.round(tt.dx), Math.round(tt.dy), w, h);
    return true;
  }

  /* ---------- one canvas laid exactly over its poster image ---------- */
  class Turntable {
    constructor(host, poster) {
      this.host = host;
      this.poster = poster;
      this.c = document.createElement('canvas');
      this.c.className = 'spin__canvas';
      this.c.setAttribute('aria-hidden', 'true');
      poster.after(this.c);
      this.ctx = this.c.getContext('2d');
      this.id = '';
      this.angle = 0;
      this.tilt = 0;                                   // degrees, top towards you
      this.key = '';
      this.fit();
      if ('ResizeObserver' in window) new ResizeObserver(() => { this.fit(); this.draw(); }).observe(poster);
      else addEventListener('resize', () => { this.fit(); this.draw(); });
    }
    fit() {
      const p = this.poster, w = p.offsetWidth, h = p.offsetHeight;
      if (!w || !h) return;
      Object.assign(this.c.style, { left: `${p.offsetLeft}px`, top: `${p.offsetTop}px`, width: `${w}px`, height: `${h}px` });
      // the cup is drawn, not scaled up from a picture: as sharp as the screen, up to 3x
      const dpr = Math.min(devicePixelRatio || 1, 3);
      this.c.width = Math.round(w * dpr);
      this.c.height = Math.round(h * dpr);
      const k = Math.min(this.c.width / 4, this.c.height / 5);           // object-fit: contain, like the poster
      this.dw = 4 * k; this.dh = 5 * k;
      this.dx = (this.c.width - this.dw) / 2; this.dy = (this.c.height - this.dh) / 2;
      this.key = '';
    }
    draw() {
      if (!R.ok || !this.dw) return;
      const key = `${this.id}:${this.angle.toFixed(2)}:${this.tilt.toFixed(2)}`;
      if (key === this.key) return;
      if (!paint(this)) return;                        // its flavour still loading: the poster stays
      this.key = key;
      if (!this.shown) { this.shown = true; this.host.classList.add('has-spin'); }  // poster hides under it
    }
  }

  /* ---------- juice bottles and shots: only the label turns ----------
     The juice, the glass and its highlights, the cap and the light look the
     same from every side, so the photograph stays as it is and only the label
     is redrawn: each column of it looks up its longitude minus the angle in a
     strip of the label unwrapped with the light taken out, and the light is
     multiplied back. The label's edges are level circles seen from a little
     above, so each column runs between two curves, not two rows. A shot's
     label is a patch that turns away round the back, so a shot is drawn on a
     plate with its label taken off. Plain 2D canvas, no WebGL. Built by
     blendmandu-3d, tools/bottle_spin.py, into assets/img/bottle/. */
  const bottleAsset = name => new URL(`../img/bottle/${name}`, SRC).href + new URL(SRC).search;
  const picture = src => new Promise((ok, no) => {
    const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = no; im.src = src;
  });
  let bottleSpec = null;
  const bottleKits = {};
  function bottleKit(id) {
    return bottleKits[id] ||= (async () => {
      bottleSpec ||= fetch(bottleAsset('bottles.json')).then(r => r.json());
      const g = (await bottleSpec)[id];
      if (!g) throw new Error(`no bottle ${id}`);
      const [band, shade, plate] = await Promise.all([
        picture(bottleAsset(`${id}-band.webp`)), picture(bottleAsset(`${id}-shade.webp`)),
        g.kind === 'patch' ? picture(bottleAsset(`${id}-plate.webp`)) : null]);
      const cols = [];
      for (let x = g.bx0; x < g.bx1; x++) {
        const d = (x + 0.5 - g.cx) / g.R;
        if (Math.abs(d) >= 1) { cols.push(null); continue; }
        const c = Math.cos(Math.asin(d));
        const y0 = g.top[0] + g.top[1] * c + g.inset - g.W0;
        const y1 = g.bot[0] + g.bot[1] * c - g.inset - g.W0;
        cols.push({ lam: Math.asin(d), y0, h: y1 - y0 });
      }
      const canvas = () => { const c = document.createElement('canvas'); c.width = g.bx1 - g.bx0; c.height = g.W1 - g.W0; return c; };
      const box = canvas(), mask = canvas();
      const kit = { g, band, shade, plate, cols, box, mask, bx: box.getContext('2d'), mx: mask.getContext('2d') };
      // a band covers its whole box at every angle: its mask is drawn once
      if (g.kind === 'band') labelColumns(kit, kit.mx, 0);
      return kit;
    })();
  }
  function labelColumns(k, x, th) {
    const { g, band, cols } = k;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (!c) continue;
      let u = ((c.lam - th) / (2 * Math.PI) + 0.5) % 1;
      if (u < 0) u += 1;
      x.drawImage(band, Math.min(Math.floor(u * g.N), g.N - 1), 0, 1, g.H, i, c.y0, 1, c.h);
    }
  }
  class Bottle extends Turntable {
    constructor(host, poster, id) {
      super(host, poster);
      this.id = id;
      this.kit = null;
      bottleKit(id).then(k => { this.kit = k; this.key = ''; this.draw(); wake(); }, () => {});
    }
    draw() {
      const k = this.kit;
      if (!k || !this.dw) return;
      const key = this.angle.toFixed(2);
      if (key === this.key) return;
      this.key = key;
      const { g, box, mask, bx, mx } = k;
      const th = this.angle * Math.PI / 180;
      // the label at this angle, its light put back
      bx.globalCompositeOperation = 'source-over';
      bx.clearRect(0, 0, box.width, box.height);
      labelColumns(k, bx, th);
      bx.globalCompositeOperation = 'multiply';
      bx.drawImage(k.shade, 0, 0);
      // multiply paints the whole box: keep only where the label is
      if (g.kind === 'patch') { mx.clearRect(0, 0, mask.width, mask.height); labelColumns(k, mx, th); }
      bx.globalCompositeOperation = 'destination-in';
      bx.drawImage(mask, 0, 0);
      bx.globalCompositeOperation = 'source-over';
      const ctx = this.ctx, s = this.dw / 800;
      ctx.clearRect(0, 0, this.c.width, this.c.height);
      ctx.drawImage(k.plate || this.poster, this.dx, this.dy, this.dw, this.dh);
      ctx.drawImage(box, this.dx + g.bx0 * s, this.dy + g.W0 * s, box.width * s, box.height * s);
      if (!this.shown) { this.shown = true; this.host.classList.add('has-spin'); }
    }
  }

  /* ---------- one animation loop for every turntable on the page ---------- */
  const actors = [];
  let raf = 0, last = 0;
  function loop(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    let more = false;
    for (const a of actors) if (a(now, dt)) more = true;
    raf = more ? requestAnimationFrame(loop) : 0;
    if (!more) last = 0;
  }
  function wake() { if (!raf) raf = requestAnimationFrame(loop); }
  const watch = (el, onChange, margin = '0px') =>
    new IntersectionObserver(([e]) => { onChange(e.isIntersecting); wake(); }, { rootMargin: margin }).observe(el);

  /* ---------- the hero, and the cup on a smoothie's own page ---------- */
  function stageCup(stage) {
    const poster = stage.querySelector('.cupstage__img');
    // on a product page the stage names its one product: spin it, never switch it
    const fixed = stage.dataset.spin || '';
    const flavours = fixed ? PRODUCTS.filter(p => p.id === fixed) : PRODUCTS.filter(p => p.cat === 'smoothies');
    if (!poster || !flavours.length) return;
    const isHero = !fixed;
    const tt = new Turntable(stage, poster);
    let fi = 0;
    tt.id = flavours[fi].id;

    const IDLE = REDUCED || SAVE ? 0 : 14.4;   // degrees a second: a turn every 25 seconds, the old hero's pace
    const DEG_PER_PX = 0.8;
    let angle = 0, vel = 0, visible = true, busy = false, turnFx = null, lift = 0;
    let tilt = 0, tiltTo = 0;                  // degrees, top towards you: dragged up and down, eased back level

    /* the page takes the flavour's colour, faded across rather than cut */
    const root = document.documentElement;
    const SHADE = [22, 14, 18];
    const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const tintOf = p => rgb(p.c2).map((v, i) => v + (SHADE[i] - v) * 0.52);
    let tintFrom = null, tintTo = null, tintT = 1;
    const setTint = c => root.style.setProperty('--tint', `rgb(${c.map(Math.round).join(',')})`);
    function paintPage(p, instant) {
      if (!isHero) return;
      root.classList.add('is-tinted');
      const to = tintOf(p);
      if (instant || REDUCED || !tintTo) { tintTo = to; tintT = 1; setTint(to); }
      else { tintFrom = tintFrom && tintT < 1 ? tintFrom.map((v, i) => v + (tintTo[i] - v) * easeTint(tintT)) : tintTo; tintTo = to; tintT = 0; }
      const label = document.querySelector('#cup-flavour');
      const price = document.querySelector('#cup-price');
      const order = document.querySelector('#cup-order');
      if (label) label.textContent = p.name;
      if (price) price.textContent = `${SHOP.currency} ${p.price}`;
      if (order) order.dataset.add = p.id;
    }
    const easeTint = t => 1 - Math.pow(1 - t, 3);
    paintPage(flavours[fi], true);

    /* A change of flavour is the old hero's three moves at once: a 0.9s
       full turn that eases out, a small lift, and a flash of light. The
       flavour changes as the cup passes its back, so it is never seen. */
    function turn(dir, onHalf) {
      return new Promise(done => { turnFx = { t0: performance.now(), dir, onHalf, done, half: false }; wake(); });
    }
    async function swap(dir) {
      if (busy) return;
      busy = true;
      if (fixed) {                       // one product: a tap is just one more turn
        if (!REDUCED && R.ok) await turn(dir);
        busy = false;
        return;
      }
      const next = (fi + dir + flavours.length) % flavours.length;
      const id = flavours[next].id;
      if (R.ok && !kitReady(id)) await within(kit(id).catch(() => {}), 4000);
      const change = () => {
        fi = next; tt.id = id; tt.key = '';
        if (!R.ok) poster.src = posterURL(id);     // no WebGL: the flavour's still
        paintPage(flavours[fi]);
      };
      if (REDUCED || !R.ok || !kitReady(id)) {
        change();
        // its textures not here yet: show its still until they are
        if (R.ok && !kitReady(id)) { poster.src = posterURL(id); stage.classList.remove('has-spin'); tt.shown = false; }
        tt.draw();
      }
      else await turn(dir, change);
      busy = false;
      neighbours();
    }
    // the flavours either side of the one showing, fetched ahead of a change
    function neighbours() {
      if (!R.ok || LOW) return;
      // when the browser is idle, not while the page is still arriving
      const go = () => { for (const d of [1, -1]) kit(flavours[(fi + d + flavours.length) % flavours.length].id).catch(() => {}); };
      if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 5000 }); else setTimeout(go, 2500);
    }

    /* drag sideways to spin, up and down to tilt, flick to throw it, tap to change flavour */
    let dragging = false, moved = false, x0 = 0, y0 = 0, lastX = 0, lastY = 0, lastT = 0;
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || e.button > 0) return;
      dragging = true; moved = false;
      x0 = lastX = e.clientX; y0 = lastY = e.clientY; lastT = performance.now();
      try { stage.setPointerCapture(e.pointerId); } catch {}
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      if (Math.abs(e.clientX - x0) > 6 || Math.abs(e.clientY - y0) > 6) moved = true;
      const now = performance.now(), dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (moved) {
        angle += dx * DEG_PER_PX;
        // dragging down pulls the front down and the top towards you, like the old 3D cup
        tiltTo = clamp(tiltTo + dy * 0.12, -MAX_TILT, MAX_TILT);
        const v = (dx * DEG_PER_PX) / Math.max((now - lastT) / 1000, 0.008);
        vel = vel * 0.5 + v * 0.5;
        wake();
      }
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    });
    // a cancel is the browser taking a vertical swipe over for scrolling: never a tap
    const release = tap => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (!moved) { vel = 0; if (tap) swap(1); return; }
      if (performance.now() - lastT > 90) vel = 0;       // held still before letting go: no throw
      vel = clamp(vel, -720, 720);
      wake();
    };
    stage.addEventListener('pointerup', () => release(true));
    stage.addEventListener('pointercancel', () => release(false));

    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { angle -= 15; wake(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { angle += 15; wake(); e.preventDefault(); }
      if (e.key === 'ArrowUp')    { tiltTo = clamp(tiltTo - 5, -MAX_TILT, MAX_TILT); wake(); e.preventDefault(); }
      if (e.key === 'ArrowDown')  { tiltTo = clamp(tiltTo + 5, -MAX_TILT, MAX_TILT); wake(); e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { swap(1); e.preventDefault(); }
    });
    if (isHero) {
      document.querySelector('#cup-next')?.addEventListener('click', () => swap(1));
      document.querySelector('#cup-prev')?.addEventListener('click', () => swap(-1));
      // #cup-order needs no listener here: app.js adds whatever its data-add names, which paintPage() keeps current
    }

    watch(stage, v => { visible = v; }, '100px');

    /* the hero stage sinks, shrinks and fades as you scroll past it */
    const docTop = el => { let y = 0; for (; el; el = el.offsetParent) y += el.offsetTop; return y; };
    let lastScroll = -1;

    actors.push((now, dt) => {
      let more = false;
      if (tintT < 1) {
        tintT = Math.min(1, tintT + dt / 0.75);
        const e = easeTint(tintT);
        setTint(tintFrom.map((v, i) => v + (tintTo[i] - v) * e));
        more = true;
      }
      if (!visible) return more;

      const idle = R.ok && !dragging ? IDLE : 0;
      if (!dragging) {
        // a throw slows into the idle turn; the idle turn eases in once the cup can be drawn
        vel = chase(vel, idle, Math.abs(vel) > IDLE * 1.5 ? 0.45 : 0.9, dt);
        angle += vel * dt;
      }
      let extra = 0;
      if (turnFx) {
        const t = Math.min(1, (now - turnFx.t0) / 900);
        const e = 1 - Math.pow(1 - t, 4);
        extra = turnFx.dir * 360 * e;
        lift = Math.sin(t * Math.PI);
        if (!turnFx.half && e >= 0.5) { turnFx.half = true; turnFx.onHalf && turnFx.onHalf(); }
        if (t >= 1) { const d = turnFx.done; turnFx = null; lift = 0; d(); }
      }
      angle = ((angle % 360) + 360) % 360;
      tt.angle = angle + extra;
      // let go, the cup settles back level; on its own it sways a little, so it reads as a cup in the round
      if (!dragging) tiltTo = chase(tiltTo, 0, 1.4, dt);
      tilt = chase(tilt, tiltTo, 0.16, dt);
      const sway = REDUCED || SAVE ? 0 : Math.sin(now * 0.00055) * 2.5;
      tt.tilt = clamp(tilt + sway, -MAX_TILT, MAX_TILT);
      tt.draw();

      // a slow float, plus the lift and the flash of a flavour change
      const bob = REDUCED ? 0 : Math.sin(now * 0.0009) * 6;
      tt.c.style.translate = `0 ${(bob - lift * 16).toFixed(2)}px`;
      tt.c.style.filter = lift > 0.002 ? `brightness(${(1 + lift * 0.24).toFixed(3)})` : '';

      if (isHero && !REDUCED && scrollY !== lastScroll) {
        lastScroll = scrollY;
        const p = clamp((scrollY - docTop(stage)) / Math.max(stage.offsetHeight, 1), 0, 1);
        stage.style.transform = p ? `translate3d(0,${(p * 90).toFixed(2)}px,0) scale(${(1 - p * 0.16).toFixed(4)})` : '';
        stage.style.opacity = p ? (1 - p * 0.55).toFixed(3) : '';
      }
      return more || !REDUCED || !!turnFx || Math.abs(vel) > 0.05 || Math.abs(tilt) > 0.01 || Math.abs(tiltTo) > 0.01;
    });
    if (isHero) addEventListener('scroll', wake, { passive: true });

    /* The textures load as soon as the cup's photo is on screen (it is the
       page's largest paint, and on a slow connection 300 KB of textures beside
       it would hold it back), not after the whole page. It is turning at full
       speed the moment it is drawn. The flavours either side load next, so a
       change of flavour does not wait. */
    (async () => {
      if (!poster.complete) await within(new Promise(r => poster.addEventListener('load', r, { once: true })), 2500);
      await within(renderer(), 8000);
      if (!R.ok) return;
      await within(kit(tt.id).catch(() => {}), 8000);
      if (!kitReady(tt.id)) return;
      if (!fixed) neighbours();
      stage.classList.add('is-live');
      vel = IDLE;
      tt.key = '';
      tt.draw();
      wake();
    })();
  }

  /* ---------- "How we blend": the same cup, turned by scrolling ---------- */
  function pinnedCup(pin) {
    const host = pin.querySelector('.pin__stage');
    const poster = host && host.querySelector('.pin__img');
    if (!poster) return;
    const tt = new Turntable(host, poster);
    tt.id = 'himalayan-berry';
    const steps = [...pin.querySelectorAll('[data-pin-step]')];
    let target = 0, cur = -1, shown = -1, visible = false;
    const measure = () => {
      const r = pin.getBoundingClientRect();
      const total = r.height - innerHeight;
      target = total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
    };
    watch(pin, v => {
      visible = v;
      if (v) { measure(); renderer().then(() => { tt.key = ''; wake(); }); }
    }, '300px 0px');
    addEventListener('scroll', () => { measure(); if (visible) wake(); }, { passive: true });
    actors.push((now, dt) => {
      if (!visible) return false;
      // chase the scroll position rather than glue to it, so the turn has weight
      cur = cur < 0 ? target : chase(cur, target, 0.12, dt);
      tt.angle = cur * 432;
      tt.tilt = Math.sin(cur * Math.PI) * 8;            // it leans towards you mid-way, as the old one did
      tt.draw();
      tt.c.style.scale = (0.86 + Math.sin(cur * Math.PI) * 0.14).toFixed(4);
      const step = Math.min(steps.length - 1, Math.floor(cur * steps.length));
      if (step !== shown) {
        steps.forEach((s, i) => s.classList.toggle('is-on', i === step));
        shown = step;
      }
      return Math.abs(target - cur) > 0.0004;
    });
  }

  /* ---------- the menu: every smoothie card turns its cup ---------- */
  function cardCups() {
    const SPEED = 28.6;                                // degrees a second, the old menu cups' pace
    const cards = new Map();                           // art -> { tt, phase, visible }
    const io = new IntersectionObserver(es => {
      for (const e of es) {
        const c = cards.get(e.target);
        if (!c) continue;
        c.visible = e.isIntersecting;
        if (c.visible && !(c.tt instanceof Bottle)) renderer().then(wake);
      }
      wake();
    }, { rootMargin: '150px' });
    function scan() {
      // the grid is redrawn on every filter and search: let go of the old cards
      for (const [el] of cards) if (!el.isConnected) { io.unobserve(el); cards.delete(el); }
      document.querySelectorAll('.card__art[data-photo]').forEach(el => {
        if (cards.has(el)) return;
        const poster = el.querySelector('.card__photo');
        if (!poster) return;
        const tt = new Turntable(el, poster);
        tt.id = el.dataset.photo;
        tt.small = true;                               // a card is a few hundred pixels across
        // cards out of step with one another, so a row never turns in unison
        cards.set(el, { tt, phase: (tt.id.charCodeAt(0) % 7) * 52 + tt.id.length * 13, visible: false });
        io.observe(el);
      });
      // a juice turns like a cup; a shot's label is a patch that would spend half of
      // every turn round the back, so a shot sways, never far from showing its label
      document.querySelectorAll('.card__art[data-bottle]').forEach(el => {
        if (cards.has(el)) return;
        const poster = el.querySelector('.card__photo');
        if (!poster) return;
        const tt = new Bottle(el, poster, el.dataset.bottle);
        cards.set(el, { tt, phase: (tt.id.charCodeAt(0) % 7) * 52 + tt.id.length * 13, visible: false,
                        sway: el.dataset.bottle.endsWith('-shot') });
        io.observe(el);
      });
    }
    actors.push(now => {
      let any = false;
      for (const [, c] of cards) {
        if (!c.visible) continue;
        if (!(c.tt instanceof Bottle) && !R.ok) continue;
        const t = now / 1000;
        c.tt.angle = c.sway ? Math.sin(t * 0.45 + c.phase) * 62 : c.phase + t * SPEED;
        c.tt.draw();
        any = true;
      }
      return any;
    });
    scan();
    addEventListener('blendmandu:cards', scan);
  }

  /* From fruit to cup: four photographs, one per step, crossfaded by the scroll.
     Each one eases in a little as it plays (a slow push-in, not a zoom), and the
     step it belongs to lights up beside it. */
  function photoStory(section) {
    const frames = [...section.querySelectorAll('.seq__frame')];
    const steps = [...section.querySelectorAll('.seq__list li')];
    const n = frames.length;
    if (!n) return;
    const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
    let visible = false, lastStep = -1, lastP = -1;

    function draw() {
      const r = section.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
      if (Math.abs(p - lastP) < 1e-4) return;
      lastP = p;
      const f = p * n;                                   // 0..n: which photograph, and how far through it
      frames.forEach((im, i) => {
        // each fades in over the one before it, across the last fifth of that one's share
        const a = i === 0 ? 1 : smooth((f - i + 0.2) / 0.4);
        const s = 1.06 - 0.06 * smooth((f - i + 0.6) / 1.6);
        im.style.opacity = a.toFixed(3);
        im.style.transform = `scale(${s.toFixed(4)})`;
      });
      const step = clamp(Math.floor(f), 0, n - 1);
      if (step !== lastStep) {
        lastStep = step;
        steps.forEach((li, i) => {
          li.classList.toggle('is-on', i === step);
          if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        });
      }
    }

    if (REDUCED) return;                                 // the stylesheet lays all four out instead
    // all four ready before the first fade, fetched as the section nears, not with the page
    watch(section, v => { if (v) frames.forEach(im => { im.loading = 'eager'; }); }, '1200px 0px');
    watch(section, v => { visible = v; if (v) wake(); }, '200px 0px');
    addEventListener('resize', () => { lastP = -1; wake(); });
    actors.push(() => {
      if (!visible) return false;
      draw();
      return false;
    });
    addEventListener('scroll', () => { if (visible) wake(); }, { passive: true });
  }

  /* ---------- a juice or a shot on its own page: turning, drag to spin, flick to throw ---------- */
  function stageBottle(stage) {
    const poster = stage.querySelector('.pdp__photo');
    if (!poster || !stage.dataset.bottle) return;
    const tt = new Bottle(stage, poster, stage.dataset.bottle);
    const IDLE = REDUCED || SAVE ? 0 : 14.4, DEG_PER_PX = 0.8;
    let vel = 0, visible = true, dragging = false, moved = false, x0 = 0, lastX = 0, lastT = 0;
    stage.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      dragging = true; moved = false; x0 = lastX = e.clientX; lastT = performance.now();
      try { stage.setPointerCapture(e.pointerId); } catch {}
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      if (Math.abs(e.clientX - x0) > 6) moved = true;
      const now = performance.now(), dx = e.clientX - lastX;
      if (moved) {
        tt.angle += dx * DEG_PER_PX;
        vel = vel * 0.5 + (dx * DEG_PER_PX) / Math.max((now - lastT) / 1000, 0.008) * 0.5;
        wake();
      }
      lastX = e.clientX; lastT = now;
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (!moved || performance.now() - lastT > 90) vel = 0;
      vel = clamp(vel, -720, 720);
      wake();
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { tt.angle -= 15; wake(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { tt.angle += 15; wake(); e.preventDefault(); }
    });
    watch(stage, v => { visible = v; }, '100px');
    actors.push((now, dt) => {
      if (!visible) return false;
      if (!dragging) {
        const idle = tt.kit ? IDLE : 0;
        vel = chase(vel, idle, Math.abs(vel) > IDLE * 1.5 ? 0.45 : 0.9, dt);
        tt.angle += vel * dt;
      }
      tt.draw();
      return dragging || IDLE > 0 || Math.abs(vel) > 0.05;
    });
  }

  /* A bowl, juice or shot on its own page: one photograph, so it cannot turn,
     but it leans a few degrees towards the pointer (or a dragging finger) and
     drifts very slightly while left alone, so it reads as an object, not a sticker. */
  function photoTilt(el) {
    const im = el.querySelector('.pdp__photo');
    if (!im || REDUCED) return;
    let tx = 0, ty = 0, x = 0, y = 0, visible = false;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
      wake();
    });
    const rest = () => { tx = 0; ty = 0; wake(); };
    el.addEventListener('pointerleave', rest);
    el.addEventListener('pointercancel', rest);
    watch(el, v => { visible = v; });
    actors.push((now, dt) => {
      if (!visible) return false;
      const k = 1 - Math.exp(-dt * 6);
      x += (tx - x) * k; y += (ty - y) * k;
      const drift = Math.sin(now * 0.0009);
      im.style.transform =
        `translateY(${(drift * 4).toFixed(2)}px) rotateY(${(x * 8 + drift * 1.5).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
      return true;
    });
  }

  document.querySelectorAll('[data-spin]').forEach(stageCup);
  const seq = document.querySelector('#seq-section');
  if (seq) photoStory(seq);
  document.querySelectorAll('[data-tilt]').forEach(photoTilt);
  document.querySelectorAll('.pdp__art[data-bottle]').forEach(stageBottle);
  const pin = document.querySelector('#pin');
  if (pin) pinnedCup(pin);
  if (!REDUCED && !SAVE) cardCups();
})();
