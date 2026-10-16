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
   towards you and away like the old 3D one. Every flavour is the same
   photograph recoloured, so all six cost one download (about 520 KB)
   and change instantly. Built by blendmandu-3d, tools/wrap_build.py and
   tools/wrap_export.py, into assets/img/cup/.

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
uniform vec4 uBox, uStrawBox, uSleeve, uKf, uFlav, uLidA, uLidB, uMBox;
uniform vec3 uMoundS;
uniform vec3 uRfit;
uniform vec2 uCfit, uBody, uPivot, uTilt, uP0, uVh, uV0h;
uniform float uKhi, uTheta, uL0, uRecolour, uTiltC, uStrawK;
const float PI = 3.14159265;

vec3 dec(vec3 c) { return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(.04045, c)); }
vec3 enc(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
// a vector times mat3(rows) is the matrix of those rows times the vector
vec3 toLab(vec3 c) {
  vec3 lms = pow(max(c * mat3(.4122214708, .5363325363, .0514459929,
                              .2119034982, .6806995451, .1073969566,
                              .0883024619, .2817188376, .6299787005), vec3(0.)), vec3(1. / 3.));
  return lms * mat3(.2104542553, .7936177850, -.0040720468,
                    1.9779984951, -2.4285922050, .4505937099,
                    .0259040371, .7827717662, -.8086757660);
}
vec3 fromLab(vec3 l) {
  vec3 lms = l * mat3(1., .3963377774, .2158037573,
                      1., -.1055613458, -.0638541728,
                      1., -.0894841775, -1.2914855480);
  return (lms * lms * lms) * mat3(4.0767416621, -3.3077115913, .2309699292,
                                  -1.2684380046, 2.6097574011, -.3413193965,
                                  -.0041960863, -.7034186147, 1.7076147010);
}
float hueOf(vec3 lab) { return length(lab.yz) > 1e-6 ? atan(lab.z, lab.y) : 0.; }
// the berry turned into the flavour: lightness by a power round the berry's
// median, chroma scaled, hue turned; wl weights the lightness on its own
vec3 recolour(vec3 c, float w, float wl) {
  vec3 lab = toLab(c);
  float L2 = min(uFlav.x * pow(max(lab.x, 1e-4) / uL0, uFlav.w), .98);
  float C2 = length(lab.yz) * uFlav.y, h2 = hueOf(lab) + uFlav.z;
  return clamp(fromLab(vec3(mix(lab.x, L2, wl), mix(lab.yz, C2 * vec2(cos(h2), sin(h2)), w))), 0., 1.);
}
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
  if (uRecolour > .5 && bA > .002) {
    float w = 1.;                                    // smoothie: all of it
    if (u >= uSleeve.z && u < uSleeve.w)             // the sleeve's edges: only what is smoothie coloured
      w = u >= uSleeve.x && u < uSleeve.y ? 0. : 1. - clamp((degrees(hueOf(toLab(alb))) - 30.) / 15., 0., 1.);
    alb = recolour(alb, w, w);
  }
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
  if (uRecolour > .5) {
    vec3 lab = toLab(hc);
    float shine = clamp((lab.x - .8) / .1, 0., 1.) * (1. - clamp((length(lab.yz) - .02) / .03, 0., 1.));
    hc = recolour(hc, 1., 1. - shine);
  }
  under = hc * hA + under * (1. - hA);
  underA = hA + underA * (1. - hA);

  float tA = texture2D(uMaps, tuv).b;
  vec3 tc = dec(texture2D(uTop, tuv).rgb);
  if (uRecolour > .5 && tA > .85) {
    vec3 un = clamp(tc / tA, 0., 1.), lab = toLab(un);
    float shine = clamp((lab.x - .8) / .1, 0., 1.) * (1. - clamp((length(lab.yz) - .02) / .03, 0., 1.));
    float w = clamp((tA - .85) / .12, 0., 1.);
    tc = recolour(un, w, w * (1. - shine)) * tA;
  }
  vec3 C = tc + under * (1. - tA);
  float A = tA + underA * (1. - tA);
  // the page composites this in sRGB: an alpha that dims the page behind as
  // much as the lid and the shadow would in linear light
  vec3 oc = enc(clamp(C, 0., 1.));
  gl_FragColor = vec4(oc, max(1. - pow(1. - clamp(A, 0., 1.), 1. / 2.2), max(oc.r, max(oc.g, oc.b))));
}`;

  /* ---------- the renderer, shared by every turntable on the page ---------- */
  const R = { ok: false };
  let rendering = null;
  const loadImg = name => new Promise((ok, no) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => ok(im);
    im.onerror = no;
    im.src = asset(name);
  });
  function renderer() {
    return (rendering ||= (async () => {
      const cv = document.createElement('canvas');
      const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
      const gl = cv.getContext('webgl2', opts) || cv.getContext('webgl', opts);
      if (!gl) return null;
      const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      if (!hp || !hp.precision) return null;
      const [geo, ...imgs] = await Promise.all([
        fetch(asset('wrap.json')).then(r => r.json()),
        ...['strip.webp', 'top.webp', 'maps.webp', 'straw.webp', 'mound.webp', 'mstrip.webp'].map(loadImg),
      ]);
      Object.assign(R, { cv, gl, geo, imgs, gl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext });
      // a lost context keeps every turntable's last picture; a restored one picks up again
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); R.ok = false; });
      cv.addEventListener('webglcontextrestored', () => { R.ok = setup(); wake(); });
      R.ok = setup();
      return R.ok ? R : null;
    })().catch(() => null));
  }
  function setup() {
    const { gl, geo, imgs, gl2 } = R;
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
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const texture = (unit, im, { repeat = false, mip = true } = {}) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      // WebGL 1 mipmaps only power-of-two sizes: the strip is one, the rest go without
      const pot = !(im.width & (im.width - 1)) && !(im.height & (im.height - 1));
      mip = mip && (gl2 || pot);
      if (mip) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // the body's edges squeeze the strip sideways: anisotropy keeps them sharp
      if (mip && aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    };
    texture(0, imgs[0], { repeat: true });
    texture(1, imgs[1]);
    texture(2, imgs[2]);
    texture(3, imgs[3], { mip: false });
    texture(4, imgs[4]);
    texture(5, imgs[5], { repeat: true });

    const U = name => gl.getUniformLocation(prog, name);
    ['uStrip', 'uTop', 'uMaps', 'uStraw', 'uMound', 'uMStrip'].forEach((n, i) => gl.uniform1i(U(n), i));
    const [bx0, by0, bx1, by1] = geo.box, [sx0, sy0, sx1, sy1] = geo.straw;
    gl.uniform4f(U('uBox'), bx0, by0, bx1 - bx0, by1 - by0);
    gl.uniform4f(U('uStrawBox'), sx0, sy0, sx1 - sx0, sy1 - sy0);
    gl.uniform4f(U('uSleeve'), ...geo.sleeve);
    gl.uniform4f(U('uKf'), ...geo.kf.slice(0, 4));
    gl.uniform1f(U('uKhi'), geo.kf[4]);
    gl.uniform2f(U('uCfit'), ...geo.cfit);
    gl.uniform3f(U('uRfit'), ...geo.rfit);
    gl.uniform2f(U('uBody'), ...geo.body);
    gl.uniform2f(U('uPivot'), ...geo.pivot);
    gl.uniform1f(U('uL0'), geo.l0);
    gl.uniform1f(U('uTiltC'), geo.tiltc);
    gl.uniform4f(U('uLidA'), ...geo.lid.slice(0, 4));
    gl.uniform4f(U('uLidB'), ...geo.lid.slice(4, 8));
    gl.uniform3f(U('uMoundS'), ...geo.mound);
    const [mx0, my0, mx1, my1] = geo.moundbox;
    gl.uniform4f(U('uMBox'), mx0, my0, mx1 - mx0, my1 - my0);
    R.u = { theta: U('uTheta'), flav: U('uFlav'), recolour: U('uRecolour'), tilt: U('uTilt'),
            p0: U('uP0'), vh: U('uVh'), v0h: U('uV0h'), strawK: U('uStrawK') };
    return true;
  }
  /* draw a cup at its angle in the shared canvas, then copy it onto the turntable's own */
  function paint(tt) {
    const { gl, cv, u, geo } = R;
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
    const own = geo.flavours[tt.id];
    gl.viewport(0, 0, w, h);
    gl.uniform1f(u.theta, th);
    gl.uniform2f(u.tilt, c, s);
    gl.uniform2f(u.p0, p0[0], p0[1]);
    gl.uniform2f(u.vh, vx / vl, vy / vl);
    gl.uniform2f(u.v0h, -Math.sin(lean), -Math.cos(lean));
    gl.uniform1f(u.strawK, L / vl);
    gl.uniform4f(u.flav, ...(own || geo.flavours['himalayan-berry']));
    gl.uniform1f(u.recolour, own && tt.id !== 'himalayan-berry' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    tt.ctx.clearRect(0, 0, tt.c.width, tt.c.height);
    // the viewport is the bottom left corner of the shared canvas
    tt.ctx.drawImage(cv, 0, cv.height - h, w, h, Math.round(tt.dx), Math.round(tt.dy), w, h);
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
      this.key = key;
      paint(this);
      if (!this.shown) { this.shown = true; this.host.classList.add('has-spin'); }  // poster hides under it
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
      const change = () => {
        fi = next; tt.id = id; tt.key = '';
        if (!R.ok) poster.src = posterURL(id);     // no WebGL: the flavour's still
        paintPage(flavours[fi]);
      };
      if (REDUCED || !R.ok) { change(); tt.draw(); }
      else await turn(dir, change);
      busy = false;
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

    /* The textures load at once, not after the page: the cup is the first
       thing on it. It is turning at full speed the moment it is drawn. */
    (async () => {
      await within(renderer(), 8000);
      if (!R.ok) return;
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
        if (c.visible) renderer().then(wake);
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
        // cards out of step with one another, so a row never turns in unison
        cards.set(el, { tt, phase: (tt.id.charCodeAt(0) % 7) * 52 + tt.id.length * 13, visible: false });
        io.observe(el);
      });
    }
    actors.push(now => {
      if (!R.ok) return false;
      let any = false;
      for (const [, c] of cards) {
        if (!c.visible) continue;
        c.tt.angle = c.phase + (now / 1000) * SPEED;
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
    frames.forEach(im => { im.loading = 'eager'; });     // all four ready before the first fade
    watch(section, v => { visible = v; if (v) wake(); }, '200px 0px');
    addEventListener('resize', () => { lastP = -1; wake(); });
    actors.push(() => {
      if (!visible) return false;
      draw();
      return false;
    });
    addEventListener('scroll', () => { if (visible) wake(); }, { passive: true });
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
  const pin = document.querySelector('#pin');
  if (pin) pinnedCup(pin);
  if (!REDUCED && !SAVE) cardCups();
})();
