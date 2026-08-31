/* ============================================================
   BLENDMANDU — WebGL cup
   Procedural geometry, no modelled asset and no texture files:
   the cup is lathed from a profile curve and the label is drawn
   into a 2D canvas at runtime.

   Three views, mirroring the reference build:
     1. hero      — drag to spin, flavour switcher, page recolours
     2. sticky    — pinned, rotation + fill driven by scroll
     3. sequence  — scroll-scrubbed 2D frame sequence
   ============================================================ */
/* Three.js is loaded with a DYNAMIC import, deliberately.
   A static `import * as THREE from …` at the top of this file is fetched
   before any of the code below runs — so a phone that fails webglOK()
   still paid 250 KB gzipped for a library it never uses. Loading it
   inside the capability check is what makes the fallback actually cheap. */
let THREE = null;

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Idle rotation is the one thing that runs without the visitor asking, so
   it is what reduced motion switches off. The cup itself stays. */
const IDLE_SPIN = REDUCED ? 0 : 0.0042;

/* i18n lookup — cup3d.js is a module, so it cannot see app.js's t() */
const t2 = (key) => {
  const L = document.documentElement.dataset.lang || 'en';
  return (window.I18N?.[L]?.[key]) || (window.I18N?.en?.[key]) || '';
};

/* WebGL is a real cost on the cheap Androids most of Kathmandu orders from.
   Bail to the flat SVG art unless the device can clearly take it. */
function webglOK() {
  /* Reduced motion used to return false here, which threw away the whole
     3D cup and left the flat SVG. That reads as a broken page, and it is
     more than the setting asks for: WCAG 2.3.3 is about animation, not
     about removing content. iOS also reports reduce whenever Low Power
     Mode is on, so a phone on low battery lost the product visual with no
     accessibility setting touched anywhere. The cup now renders either
     way; what reduced motion removes is the idle spin and the transitions. */
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    // Dropped deviceMemory / hardwareConcurrency guards — the cup is
    // simple lathe geometry + a canvas texture.  Any phone that can
    // create a WebGL context can render it without jank.
    if (navigator.connection && /^(slow-)?2g$/.test(navigator.connection.effectiveType)) return false;
    return true;
  } catch { return false; }
}

/* ---------- tween helpers ----------
   The reference drives its motion with GSAP. These reproduce the specific
   behaviours it uses rather than pulling in the library:
     - easeOutQuart  ~ Power4.easeOut  (their 0.9s 360-degree spin)
     - easeOutCubic  ~ CustomEase "0.33, 1, 0.68, 1" (their carousel)
     - damp()        ~ a gsap.to(..., 0.5, {...}) on a scroll-derived value,
                       which is what stops their scroll motion snapping.
--------------------------------------------------------------- */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease  = t => 1 - Math.pow(1 - t, 3);
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/* frame-rate independent damping — approaches `to` with a half-life,
   so it behaves the same at 60Hz and 120Hz */
const damp = (cur, to, smoothing, dt) =>
  lerp(cur, to, 1 - Math.pow(smoothing, dt * 60));

const tweens = [];
function tween(onUpdate, dur, easing = easeOutQuart, onDone) {
  if (REDUCED) {            // jump straight to the finished state
    onUpdate(1);
    if (onDone) onDone();
    return;
  }
  const t0 = performance.now();
  tweens.push({ onUpdate, dur: dur * 1000, easing, onDone, t0 });
}
function runTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const p = clamp((now - tw.t0) / tw.dur, 0, 1);
    tw.onUpdate(tw.easing(p), p);
    if (p >= 1) { tweens.splice(i, 1); tw.onDone && tw.onDone(); }
  }
}

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbCss = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

/* The page takes the flavour's colour, but pushed well down toward black.
   Tint with c2 raw and the cup — which IS c1..c2 — vanishes into it. */
const SHADE = [22, 14, 18];
const tintOf = p => mix(hexToRgb(p.c2), SHADE, 0.52);

/* ============================================================
   LABEL TEXTURE — the wrap that goes round the cup
   ============================================================ */
function labelTexture(p, W = 1024, H = 512, plain = false, band = null) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  /* Everything below is positioned with fixed offsets that were tuned for
     a 1024x512 sheet: the label panel, the rule weights, the text
     baselines. Scaling the context rather than those numbers means a
     smaller texture is the same artwork shrunk, not the same artwork
     cropped. Halving the canvas without this made the white panel swallow
     the flavour gradient, so every card cup rendered cream. */
  const DW = 1024, DH = 512;
  x.scale(W / DW, H / DH);

  // base flavour gradient
  const g = x.createLinearGradient(0, 0, 0, DH);
  g.addColorStop(0, p.c1);
  g.addColorStop(1, p.c2);
  x.fillStyle = g;
  x.fillRect(0, 0, DW, DH);

  /* The gradient covers the whole sheet, but the printed matter must not.
     A label wraps the straight body of a vessel, and on a bottle that body
     is only v 0.23 to 0.70 of the profile, so drawing across the full
     sheet pushed the flavour name onto the shoulder and the volume line
     around the base. Squeeze the artwork into the band the body occupies.
     Canvas y runs top down and v runs bottom up, hence the inversion. */
  /* Scaling the context to fit the band squashed the glyphs: on a shot,
     whose body is only a third of the profile, the wordmark came out
     visibly flattened. Move the artwork to the middle of the band instead
     and pull its own spacing in by the same factor, so the type keeps its
     proportions and only the layout tightens. */
  const k = band ? (band[1] - band[0]) : 1;
  /* Scaling by k alone shrank a shot's label to nothing: only the vertical
     ever needed constraining, since the label wraps the circumference and
     has width to spare. Hold a legibility floor, and on a band too short
     for three stacked elements print just the panel, which is all a real
     60ml bottle carries anyway. */
  const sc = band ? Math.min(1, Math.max(k * 1.9, 0.62)) : 1;
  const tight = k < 0.36;
  if (band) {
    const mid = DH * (1 - (band[0] + band[1]) / 2);
    x.translate(0, mid - DH / 2);
  }

  /* A bowl is wide and shallow and a shot is tiny, so the tall cup's
     300x250 panel would either stretch across the whole sheet or shrink
     past reading. Those get the flavour gradient and a compact wordmark
     band instead, which survives both shapes. */
  if (plain) {
    for (const cx of [DW * 0.25, DW * 0.75]) {
      x.save();
      x.translate(cx, DH / 2);
      x.scale(sc, sc);
      x.fillStyle = 'rgba(248,247,229,.93)';
      x.fillRect(-190, -46, 380, 92);
      x.fillStyle = '#1d1d1d';
      x.textAlign = 'center';
      x.font = '52px Righteous, sans-serif';
      x.fillText('BLENDMANDU', 0, 18);
      x.restore();

      if (!tight) {
      x.save();
      x.translate(cx, DH / 2 - 96 * k);
      x.scale(sc, sc);
      x.fillStyle = '#f8f7e5';
      x.textAlign = 'center';
      x.font = '40px Righteous, sans-serif';
      x.fillText(p.name.toUpperCase(), 0, 0);
      x.restore();

      x.save();
      x.translate(cx, DH / 2 + 104 * k);
      x.scale(sc, sc);
      x.fillStyle = 'rgba(248,247,229,.85)';
      x.textAlign = 'center';
      x.font = '30px Righteous, sans-serif';
      x.fillText(p.meta.split('·')[0].trim().toUpperCase(), 0, 0);
      x.restore();
      }
    }
    const tp = new THREE.CanvasTexture(c);
    tp.colorSpace = THREE.SRGBColorSpace;
    tp.anisotropy = 8;
    return tp;
  }

  // the label panel repeats twice so it reads from either side
  for (const cx of [DW * 0.25, DW * 0.75]) {
    x.save();
    x.translate(cx, DH / 2);
    x.scale(sc, sc);

    x.fillStyle = '#f8f7e5';
    x.fillRect(-150, -125, 300, 250);
    x.strokeStyle = '#1d1d1d';
    x.lineWidth = 9;
    x.strokeRect(-150, -125, 300, 250);

    x.fillStyle = '#1d1d1d';
    x.textAlign = 'center';
    x.font = '68px Righteous, sans-serif';
    x.fillText('BLEND', 0, -30);
    x.fillText('MANDU', 0, 42);

    x.fillStyle = p.c2;
    x.font = '26px Righteous, sans-serif';
    x.fillText('KATHMANDU · 24/7', 0, 92);

    x.restore();

    // flavour name above the panel
    x.save();
    x.translate(cx, DH / 2 - 168 * k);
    x.scale(sc, sc);
    x.fillStyle = '#f8f7e5';
    x.textAlign = 'center';
    x.font = '44px Righteous, sans-serif';
    x.fillText(p.name.toUpperCase(), 0, 0);
    x.restore();

    // volume line below
    x.save();
    x.translate(cx, DH / 2 + 178 * k);
    x.scale(sc, sc);
    x.fillStyle = 'rgba(248,247,229,.85)';
    x.textAlign = 'center';
    x.font = '28px Righteous, sans-serif';
    x.fillText(p.meta.split('·')[0].trim().toUpperCase(), 0, 0);
    x.restore();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ============================================================
   CUP MESH — lathed body + dome lid + straw
   ============================================================ */
/* The four vessels the menu actually sells. Everything used to be built
   as the tall smoothie cup, so a bowl, a juice bottle and a 60ml shot all
   arrived on the card as the same lidded cup with a straw in it. The data
   already said which was which; only the geometry ignored it. */
const VESSELS = {
  /* tall: the smoothie cup, rolled rim, domed lid, straw */
  tall: () => {
    const pts = [new THREE.Vector2(0, -1.30), new THREE.Vector2(0.52, -1.30),
                 new THREE.Vector2(0.56, -1.24)];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector2(0.56 + t * 0.26, -1.24 + t * 2.42));
    }
    pts.push(new THREE.Vector2(0.86, 1.22));
    return { pts, rim: [0.87, 1.22], lid: [0.86, 1.22, 0.52], straw: true,
             scale: 1, plainLabel: false };
  },

  /* bowl: wide and shallow on a short foot, open, with the blend showing */
  bowl: () => {
    /* A short wide foot, not a stem: the first pass gave it a long narrow
       base and the thing read as a funnel rather than a bowl. */
    const pts = [new THREE.Vector2(0, -0.58), new THREE.Vector2(0.36, -0.58),
                 new THREE.Vector2(0.40, -0.53), new THREE.Vector2(0.40, -0.44),
                 new THREE.Vector2(0.50, -0.38)];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      /* ease the radius faster than the height so the wall curves out and
         then levels, which is a bowl. Linear in both is a cone. */
      pts.push(new THREE.Vector2(0.50 + 0.70 * Math.sin(t * Math.PI / 2),
                                 -0.38 + 0.80 * Math.pow(t, 1.45)));
    }
    return { pts, rim: [1.21, 0.42], fill: [1.02, 0.15, 0.20], granola: true,
             scale: 1.05, plainLabel: true, tilt: -0.38, band: [0.40, 0.96] };
  },

  /* bottle: cold pressed juice, straight sided with a shoulder and a cap */
  bottle: () => {
    const pts = [new THREE.Vector2(0, -1.15), new THREE.Vector2(0.44, -1.15),
                 new THREE.Vector2(0.48, -1.09), new THREE.Vector2(0.50, -0.96),
                 new THREE.Vector2(0.50, 0.34)];
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector2(0.50 - 0.30 * Math.pow(t, 1.4), 0.34 + 0.52 * t));
    }
    pts.push(new THREE.Vector2(0.20, 1.10));
    return { pts, cap: [0.235, 0.26, 1.20], scale: 1, plainLabel: false,
             band: [0.26, 0.67] };   /* body measures 0.23 to 0.70 */
  },

  /* shot: 60ml, squat, capped. Scaled up so it fills a card without
     pretending to be a bottle. */
  shot: () => {
    /* Squat on purpose. The first pass was slim enough that on its own
       card, with no other object to judge it against, a 60ml shot read as
       just another juice bottle. Width against height is the only cue the
       frame gives, so it has to carry the difference. */
    const pts = [new THREE.Vector2(0, -0.46), new THREE.Vector2(0.40, -0.46),
                 new THREE.Vector2(0.44, -0.41), new THREE.Vector2(0.45, -0.18),
                 new THREE.Vector2(0.45, 0.10)];
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector2(0.45 - 0.23 * Math.pow(t, 1.25), 0.10 + 0.22 * t));
    }
    pts.push(new THREE.Vector2(0.22, 0.40));
    return { pts, cap: [0.255, 0.20, 0.47], scale: 1.62, plainLabel: true,
             band: [0.37, 0.68] };   /* body measures 0.34 to 0.71 */
  },
};

/* LatheGeometry hands out the texture's V coordinate by point INDEX, not
   by distance along the profile. The bottle's straight body is 47% of its
   height but only one step out of thirteen, so it received 8% of the
   label, while the shoulder took 69%. That is why the flavour name climbed
   onto the neck and the volume line slid off the bottom.

   Resampling at even arc length makes V track physical height, so the
   label sits where it is drawn on every vessel. */
function resample(pts, n = 128) {
  const dist = [0];
  for (let i = 1; i < pts.length; i++) dist.push(dist[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = dist[dist.length - 1];
  if (!total) return pts;
  const out = [];
  let seg = 1;
  for (let i = 0; i < n; i++) {
    const target = total * i / (n - 1);
    while (seg < pts.length - 1 && dist[seg] < target) seg++;
    const span = dist[seg] - dist[seg - 1] || 1;
    const t = (target - dist[seg - 1]) / span;
    out.push(new THREE.Vector2(
      pts[seg - 1].x + (pts[seg].x - pts[seg - 1].x) * t,
      pts[seg - 1].y + (pts[seg].y - pts[seg - 1].y) * t));
  }
  return out;
}

function buildCup(product, texW, texH) {
  const group = new THREE.Group();
  const spec = (VESSELS[product.cup] || VESSELS.tall)();
  /* Parts go on an inner group so a vessel can carry a fixed tilt while the
     outer group is still free to be spun on Y by whoever is driving it. */
  const inner = new THREE.Group();
  inner.rotation.x = spec.tilt || 0;
  group.add(inner);

  const body = new THREE.Mesh(
    new THREE.LatheGeometry(resample(spec.pts), 96),
    new THREE.MeshStandardMaterial({
      map: labelTexture(product, texW, texH, spec.plainLabel, spec.band),
      roughness: 0.42,
      metalness: 0.06,
    })
  );
  inner.add(body);

  if (spec.rim) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(spec.rim[0], 0.045, 16, 96),
      new THREE.MeshStandardMaterial({ color: 0xefe7d2, roughness: 0.5 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = spec.rim[1];
    inner.add(rim);
  }

  if (spec.lid) {
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(spec.lid[0], 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color: 0xdcd3bc, roughness: 0.28, transmission: 0.45,
        thickness: 0.4, transparent: true, opacity: 0.92,
      })
    );
    lid.position.y = spec.lid[1];
    lid.scale.y = spec.lid[2];
    inner.add(lid);
  }

  if (spec.straw) {
    const straw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 1.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x191917, roughness: 0.55 })
    );
    straw.position.set(0.2, 1.85, 0.05);
    straw.rotation.z = -0.17;
    inner.add(straw);
  }

  if (spec.cap) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(spec.cap[0], spec.cap[0], spec.cap[1], 48),
      new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.45 })
    );
    cap.position.y = spec.cap[2];
    inner.add(cap);
  }

  /* An open bowl has to show what is in it, otherwise it reads as a very
     short cup with nothing inside. */
  if (spec.fill) {
    const surface = new THREE.Mesh(
      new THREE.SphereGeometry(spec.fill[0], 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(product.c1), roughness: 0.62 })
    );
    surface.position.y = spec.fill[1];
    surface.scale.y = spec.fill[2];
    inner.add(surface);

    if (spec.granola) {
      const bits = new THREE.MeshStandardMaterial({ color: 0xc79a5a, roughness: 0.85 });
      const seed = new THREE.DodecahedronGeometry(0.062, 0);
      for (let i = 0; i < 11; i++) {
        const a = i * 2.399;                       // golden angle, so no clumping
        const r = 0.22 + 0.58 * Math.sqrt(i / 11);
        const bit = new THREE.Mesh(seed, bits);
        /* on the blend, inside the rim: they were landing at rim height and
           reading as teeth around the edge */
        bit.position.set(Math.cos(a) * r,
                         spec.fill[1] + spec.fill[0] * spec.fill[2] * 0.72,
                         Math.sin(a) * r);
        bit.rotation.set(a, a * 1.7, a * 0.6);
        inner.add(bit);
      }
    }
  }

  group.scale.setScalar(spec.scale);
  group.userData.body = body;
  return group;
}

function makeScene(canvas, { alpha = true } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha, antialias: true, powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.6);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 2.05);
  key.position.set(3, 5, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffd9b0, 1.05);
  rim.position.set(-4, 1, -3);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.3);
  fill.position.set(-2, -3, 3);
  scene.add(fill);

  const lights = { amb: scene.children[0], key, rim, fill };

  const BASE_Z = 7.6;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    const aspect = r.width / r.height;
    camera.aspect = aspect;
    // fov is vertical, so a tall narrow stage (phones) crops the cup at the
    // sides — back the camera off in proportion to how narrow it gets.
    camera.position.z = aspect < 1 ? BASE_Z * (1 + (1 - aspect) * 0.55) : BASE_Z;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  return { renderer, scene, camera, resize, lights };
}

/* ============================================================
   1. HERO — drag to spin, flavour switcher, page recolour
   ============================================================ */
function initHero() {
  const canvas = document.querySelector('#cup-hero');
  if (!canvas) return;

  const flavours = PRODUCTS.filter(p => p.cat === 'smoothies');
  let index = 0;

  const { renderer, scene, camera, resize, lights } = makeScene(canvas);
  let cup = buildCup(flavours[index]);
  scene.add(cup);

  // spin state
  let spin = 0, spinVel = IDLE_SPIN, targetTilt = 0, tilt = 0;
  let dragging = false, lastX = 0, lastY = 0, moved = false;

  canvas.addEventListener('pointerdown', e => {
    dragging = true; moved = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    spinVel += dx * 0.00042;
    targetTilt = clamp(targetTilt + dy * 0.0022, -0.42, 0.42);
    lastX = e.clientX; lastY = e.clientY;
  });
  const release = e => {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    if (!moved) next();                    // a click (not a drag) advances flavour
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.style.cursor = 'grab';

  /* ---- page recolour, the way their per-beer background works ---- */
  const root = document.documentElement;
  const CREAM = hexToRgb('#f8f7e5');
  let bgFrom = CREAM.slice(), bgTo = CREAM.slice(), bgT = 1;

  function paint(p, instant = false) {
    bgFrom = bgTo.slice();
    bgTo = tintOf(p);
    bgT = instant ? 1 : 0;
    root.classList.add('is-tinted');
    if (instant) root.style.setProperty('--tint', rgbCss(bgTo));
    const label = document.querySelector('#cup-flavour');
    if (label) label.textContent = p.name;
    const price = document.querySelector('#cup-price');
    if (price) price.textContent = `${SHOP.currency} ${p.price}`;
    const link = document.querySelector('#cup-order');
    if (link) link.dataset.add = p.id;
  }

  /* Swap only what actually changes. The geometry, lid, rim and straw are
     identical between flavours; rebuilding them allocated a fresh lathe and
     a 1024x512 texture canvas on every click, which on a cheap phone is how
     you get jank and eventually a lost context. */
  /* The reference does three things at once on a flavour change: a 0.9s
     Power4.easeOut full rotation, a small lift, and a flash across four
     lights. Doing only the texture swap is what made ours feel flat. */
  const BASE_LIGHTS = { key: 2.05, rim: 1.05, fill: 0.3, amb: 0.55 };
  let spinOffset = 0, lift = 0;

  function swap(i) {
    index = (i + flavours.length) % flavours.length;
    const p = flavours[index];
    const body = cup.userData.body;

    // half a turn in, swap the label on the hidden side, half a turn out
    const from = spinOffset;
    const to = from + Math.PI * 2;
    let swapped = false;
    tween(t => {
      spinOffset = lerp(from, to, t);
      // t here is the EASED progress, so t*360deg is the actual rotation.
      // Swap at 180deg — the back of the cup — so the change is never seen.
      if (!swapped && t > 0.5) {
        swapped = true;
        const oldMap = body.material.map;
        body.material.map = labelTexture(p);
        body.material.needsUpdate = true;
        oldMap?.dispose();
      }
    }, 0.9, easeOutQuart);

    tween(t => { lift = Math.sin(t * Math.PI) * 0.16; }, 0.9, easeOutCubic);

    tween(t => {
      const pulse = Math.sin(t * Math.PI);
      lights.key.intensity  = BASE_LIGHTS.key  + pulse * 1.5;
      lights.rim.intensity  = BASE_LIGHTS.rim  + pulse * 2.4;
      lights.fill.intensity = BASE_LIGHTS.fill + pulse * 0.5;
      lights.amb.intensity  = BASE_LIGHTS.amb  + pulse * 0.25;
    }, 0.9, easeOutCubic);

    paint(p);
  }
  const next = () => swap(index + 1);

  document.querySelector('#cup-next')?.addEventListener('click', next);
  document.querySelector('#cup-prev')?.addEventListener('click', () => swap(index - 1));
  document.querySelector('#cup-order')?.addEventListener('click', e => {
    addToCart(e.currentTarget.dataset.add || flavours[index].id);
  });

  paint(flavours[0], true);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 })
    .observe(canvas);

  /* Their hero canvas translates and scales down as you scroll away from it
     (canvasWrapper y + scale, both keyed off scroll percentage). Without it
     the cup sits rigidly in place while everything else moves. */
  const stage = canvas.parentElement;
  let stageY = 0, stageScale = 1;
  function stageTarget() {
    const r = stage.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(r.height, 1), 0, 1);
    return { y: p * 90, s: 1 - p * 0.16, o: 1 - p * 0.55 };
  }

  let last = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    runTweens(now);
    if (!visible) return;

    if (!dragging) spinVel = damp(spinVel, IDLE_SPIN, 0.6, dt);
    spin += spinVel * (dt * 60);
    spinVel *= Math.pow(0.955, dt * 60);
    tilt = damp(tilt, targetTilt, 0.35, dt);

    cup.rotation.y = spin + spinOffset;
    cup.rotation.x = tilt;
    cup.position.y = Math.sin(now * 0.0009) * 0.06 + lift;
    cup.scale.setScalar(damp(cup.scale.x, 1, 0.3, dt));

    const st = stageTarget();
    stageY = damp(stageY, st.y, 0.02, dt);
    stageScale = damp(stageScale, st.s, 0.02, dt);
    stage.style.transform = `translate3d(0,${stageY.toFixed(2)}px,0) scale(${stageScale.toFixed(4)})`;
    stage.style.opacity = st.o.toFixed(3);

    if (bgT < 1) {
      bgT = clamp(bgT + 0.022, 0, 1);
      const t = ease(bgT);
      root.style.setProperty('--tint',
        rgbCss(bgFrom.map((v, i) => lerp(v, bgTo[i], t))));
    }

    renderer.render(scene, camera);
  });

  resize();
}

/* ============================================================
   2. STICKY — pinned cup, rotation + scale driven by scroll
   ============================================================ */
function initSticky() {
  const canvas = document.querySelector('#cup-sticky');
  const section = document.querySelector('#pin');
  if (!canvas || !section) return;

  const { renderer, scene, camera, resize } = makeScene(canvas);
  const cup = buildCup(PRODUCTS.find(p => p.id === 'himalayan-berry') || PRODUCTS[0]);
  scene.add(cup);

  const steps = [...section.querySelectorAll('[data-pin-step]')];
  let progress = 0, shown = -1, visible = false;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 })
    .observe(section);

  function measure() {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    progress = total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
  }
  addEventListener('scroll', measure, { passive: true });
  measure();

  /* Their scroll rotation is a gsap.to(..., 0.5, {...}) — it chases the
     scroll value rather than tracking it exactly, which is what makes the
     motion feel weighted instead of glued to the scrollbar. */
  let rotY = 0, rotX = 0, scl = 0.82, last2 = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last2) / 1000, 0.05);
    last2 = now;
    if (!visible) return;

    rotY = damp(rotY, progress * Math.PI * 2.4, 0.02, dt);
    rotX = damp(rotX, Math.sin(progress * Math.PI) * 0.22, 0.02, dt);
    scl  = damp(scl, 0.82 + Math.sin(progress * Math.PI) * 0.2, 0.02, dt);

    cup.rotation.y = rotY;
    cup.rotation.x = rotX;
    cup.scale.setScalar(scl);

    const step = clamp(Math.floor(progress * steps.length), 0, steps.length - 1);
    if (step !== shown) {
      steps.forEach((s, i) => s.classList.toggle('is-on', i === step));
      shown = step;
    }
    renderer.render(scene, camera);
  });

  resize();
}

/* ============================================================
   3. SEQUENCE — scroll-scrubbed 2D frames

   Drawn in a fixed 1000x560 design space and scaled to fit, so the
   composition is identical at every canvas size instead of collapsing
   to a few small shapes on a wide canvas.

   Colours are read from the live CSS custom properties each frame. The
   previous version hardcoded a near-black outline, which is invisible on
   the tinted homepage this section actually lives on.
   ============================================================ */
function initSequence() {
  const canvas = document.querySelector('#seq');
  const section = document.querySelector('#seq-section');
  const caption = document.querySelector('#seq-caption');
  if (!canvas || !section) return;

  const x = canvas.getContext('2d');
  const FRAMES = 90;
  let frame = -1, lastStep = -1;

  /* Two design spaces. A 1000x500 side-by-side composition scaled to a
     353x440 phone canvas gives 0.35 scale and ~260px of dead letterbox —
     which is exactly the sparse, tiny look this section had. Portrait
     canvases get a stacked layout instead. */
  const LAND = { w: 1000, h: 500 };
  const PORT = { w: 620,  h: 780 };
  const FRUIT = ['#E4568D', '#F2C14E', '#7FBF5A', '#B5417C', '#F5A93C', '#6BAE4C'];

  function theme() {
    const cs = getComputedStyle(document.documentElement);
    return {
      ink: cs.getPropertyValue('--ink').trim() || '#1d1d1d',
      cream: cs.getPropertyValue('--cream').trim() || '#f8f7e5',
      accent: cs.getPropertyValue('--accent').trim() || '#ff834f',
    };
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    frame = -1;
  }

  /* ---------- pieces ---------- */

  function blenderBase(c, T, jx, jy, jw, jh) {
    c.fillStyle = T.ink;
    c.beginPath();
    c.moveTo(jx - jw * 0.34, jy + jh / 2);
    c.lineTo(jx + jw * 0.34, jy + jh / 2);
    c.lineTo(jx + jw * 0.46, jy + jh / 2 + 74);
    c.lineTo(jx - jw * 0.46, jy + jh / 2 + 74);
    c.closePath();
    c.fill();
    c.fillStyle = T.accent;                       // control dial
    c.beginPath();
    c.arc(jx, jy + jh / 2 + 40, 13, 0, Math.PI * 2);
    c.fill();
  }

  // jar body as a path so it can be filled, clipped and stroked consistently
  function jarPath(c, jx, jy, jw, jh) {
    const tw = jw / 2, bw = jw * 0.40;
    c.beginPath();
    c.moveTo(jx - tw, jy - jh / 2);
    c.lineTo(jx - bw, jy + jh / 2 - 16);
    c.quadraticCurveTo(jx - bw, jy + jh / 2, jx - bw + 16, jy + jh / 2);
    c.lineTo(jx + bw - 16, jy + jh / 2);
    c.quadraticCurveTo(jx + bw, jy + jh / 2, jx + bw, jy + jh / 2 - 16);
    c.lineTo(jx + tw, jy - jh / 2);
    c.closePath();
  }

  function drawJar(c, T, jx, jy, jw, jh, fill, swirl) {
    // liquid
    if (fill > 0) {
      c.save();
      jarPath(c, jx, jy, jw, jh);
      c.clip();
      const top = jy + jh / 2 - jh * 0.92 * fill;
      const g = c.createLinearGradient(0, top, 0, jy + jh / 2);
      g.addColorStop(0, '#E4568D');
      g.addColorStop(1, '#7B2D57');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(jx - jw, top);
      for (let i = 0; i <= 20; i++) {                 // wavy surface
        const px = jx - jw + (i / 20) * jw * 2;
        c.lineTo(px, top + Math.sin(i * 0.9 + swirl * 4) * 6 * fill);
      }
      c.lineTo(jx + jw, jy + jh);
      c.lineTo(jx - jw, jy + jh);
      c.closePath();
      c.fill();

      // vortex: arcs rather than scattered dots, so it reads as motion
      if (swirl > 0) {
        c.globalAlpha = 0.5;
        c.lineWidth = 7;
        c.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          const rad = 20 + i * 17;
          const a0 = swirl * 9 + i * 0.8;
          c.strokeStyle = FRUIT[i % FRUIT.length];
          c.beginPath();
          c.ellipse(jx, jy + jh * 0.12, rad, rad * 0.42, 0, a0, a0 + 2.1);
          c.stroke();
        }
        c.globalAlpha = 1;
      }
      c.restore();
    }

    // glass
    c.lineWidth = 6;
    c.strokeStyle = T.ink;
    jarPath(c, jx, jy, jw, jh);
    c.stroke();

    // measurement marks
    c.lineWidth = 4;
    c.globalAlpha = 0.45;
    for (let i = 1; i <= 3; i++) {
      const my = jy + jh / 2 - (jh * 0.2) * i;
      c.beginPath();
      c.moveTo(jx + jw * 0.20, my);
      c.lineTo(jx + jw * 0.34, my);
      c.stroke();
    }
    c.globalAlpha = 1;

    // lid + knob
    c.fillStyle = T.ink;
    c.beginPath();
    c.roundRect(jx - jw / 2 - 14, jy - jh / 2 - 26, jw + 28, 26, 8);
    c.fill();
    c.beginPath();
    c.roundRect(jx - 22, jy - jh / 2 - 44, 44, 20, 9);
    c.fill();
  }

  // finished cup, matching the product artwork used everywhere else
  function drawCup(c, T, ux, uy, uw, uh, reveal) {
    c.save();
    c.globalAlpha = reveal;
    const tw = uw / 2, bw = uw * 0.40;

    c.beginPath();                                   // body
    c.moveTo(ux - tw, uy - uh / 2);
    c.lineTo(ux - bw, uy + uh / 2 - 14);
    c.quadraticCurveTo(ux - bw, uy + uh / 2, ux - bw + 14, uy + uh / 2);
    c.lineTo(ux + bw - 14, uy + uh / 2);
    c.quadraticCurveTo(ux + bw, uy + uh / 2, ux + bw, uy + uh / 2 - 14);
    c.lineTo(ux + tw, uy - uh / 2);
    c.closePath();
    const g = c.createLinearGradient(0, uy - uh / 2, 0, uy + uh / 2);
    g.addColorStop(0, '#E4568D');
    g.addColorStop(1, '#7B2D57');
    c.fillStyle = g; c.fill();
    c.lineWidth = 6; c.strokeStyle = T.ink; c.stroke();

    /* The label is always a cream panel with dark type, exactly like the
       product artwork — themed tokens would invert it on the tinted page.
       Type is measured and scaled so it cannot spill outside the panel. */
    const lw = uw * 0.74, lh = uh * 0.30, ly = uy + uh * 0.04;
    c.fillStyle = '#f8f7e5';
    c.fillRect(ux - lw / 2, ly - lh / 2, lw, lh);
    c.lineWidth = 5; c.strokeStyle = '#1d1d1d';
    c.strokeRect(ux - lw / 2, ly - lh / 2, lw, lh);

    const fit = (txt, maxW, startPx) => {
      let px = startPx;
      c.font = `${px}px Righteous, sans-serif`;
      while (px > 6 && c.measureText(txt).width > maxW) {
        px -= 1;
        c.font = `${px}px Righteous, sans-serif`;
      }
      return px;
    };
    c.fillStyle = '#1d1d1d';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const inner = lw - 16;
    const px = Math.min(fit('BLEND', inner, lh * 0.34), fit('MANDU', inner, lh * 0.34));
    c.font = `${px}px Righteous, sans-serif`;
    c.fillText('BLEND', ux, ly - px * 0.58);
    c.fillText('MANDU', ux, ly + px * 0.58);
    c.textBaseline = 'alphabetic';

    c.fillStyle = '#dcd3bc';                          // dome lid
    c.beginPath();
    c.ellipse(ux, uy - uh / 2, tw + 6, 26, 0, Math.PI, 0);
    c.fill();
    c.lineWidth = 6; c.strokeStyle = T.ink; c.stroke();
    c.beginPath();
    c.roundRect(ux - tw - 8, uy - uh / 2 - 6, uw + 16, 14, 6);
    c.fillStyle = '#efe7d2'; c.fill(); c.stroke();

    c.strokeStyle = T.ink;                            // straw
    c.lineWidth = 14; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(ux + 16, uy - uh / 2 - 12);
    c.lineTo(ux + 40, uy - uh / 2 - 82);
    c.stroke();
    c.restore();
  }

  /* ---------- frame ---------- */
  function draw(f) {
    const r = canvas.getBoundingClientRect();
    const W = r.width, H = r.height;
    if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio, 2);

    const stacked = W / H < 1.35;
    const D = stacked ? PORT : LAND;
    const DW = D.w, DH = D.h;
    const scale = Math.min(W / DW, H / DH);

    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, W, H);
    x.translate((W - DW * scale) / 2, (H - DH * scale) / 2);
    x.scale(scale, scale);

    const T = theme();
    const t = f / (FRAMES - 1);

    const jx = stacked ? DW * 0.42 : DW * 0.35;
    const jy = stacked ? DH * 0.26 : DH * 0.42;
    const jw = stacked ? 235 : 250;
    const jh = stacked ? 265 : 290;

    const ux = stacked ? DW * 0.62 : DW * 0.71;
    const uy = stacked ? DH * 0.755 : DH * 0.44;
    const uw = stacked ? 170 : 175;
    const uh = stacked ? 300 : 310;

    blenderBase(x, T, jx, jy, jw, jh);

    // 1. fruit falls in
    const drop = clamp(t / 0.30, 0, 1);
    if (t < 0.34) {
      FRUIT.forEach((col, i) => {
        const d = clamp((drop - i * 0.10) * 1.9, 0, 1);
        if (d <= 0) return;
        const px = jx + (i - 2.5) * (stacked ? 28 : 34);
        const py = jy - jh * 1.25 + ease(d) * (jh * 1.35);
        const rot = d * 5 + i;
        x.save();
        x.translate(px, py); x.rotate(rot);
        x.beginPath(); x.arc(0, 0, 26 - d * 6, 0, Math.PI * 2);
        x.fillStyle = col; x.fill();
        x.lineWidth = 5; x.strokeStyle = T.ink; x.stroke();
        x.beginPath();                                  // highlight
        x.arc(-7, -7, 5, 0, Math.PI * 2);
        x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
        x.restore();
      });
    }

    // 2. blend  3. jar empties as it pours
    const blend = clamp((t - 0.24) / 0.30, 0, 1);
    const pour  = clamp((t - 0.54) / 0.24, 0, 1);
    drawJar(x, T, jx, jy, jw, jh, Math.max(0, blend - pour * 0.95), blend * (1 - pour));

    // pour stream
    if (pour > 0 && pour < 1) {
      x.strokeStyle = '#C9407B';
      x.lineWidth = 18; x.lineCap = 'round';
      x.beginPath();
      x.moveTo(jx + jw * 0.42, jy - jh * 0.12);
      if (stacked) {
        x.quadraticCurveTo(jx + jw * 1.1, (jy + uy) / 2, ux, uy - uh / 2 + 26);
      } else {
        x.quadraticCurveTo(ux - uw * 0.9, jy - jh * 0.1, ux, uy - uh / 2 + 30);
      }
      x.setLineDash([46, 26]);
      x.lineDashOffset = -pour * 140;
      x.stroke();
      x.setLineDash([]);
    }

    // 4. finished cup
    const reveal = clamp((t - 0.62) / 0.26, 0, 1);
    if (reveal > 0) drawCup(x, T, ux, uy, uw, uh * (0.55 + 0.45 * ease(reveal)), reveal);

    // caption tracks the stage
    const step = t < 0.24 ? 0 : t < 0.54 ? 1 : t < 0.78 ? 2 : 3;
    if (caption && step !== lastStep) {
      lastStep = step;
      caption.textContent = t2(`seq.step${step + 1}`);
    }
  }

  function tick() {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = total <= 0 ? 0 : clamp(-r.top / total, 0, 1);
    const f = Math.round(p * (FRAMES - 1));
    if (f !== frame) { frame = f; draw(f); }
  }

  /* Driven by rAF while the section is on screen rather than by scroll
     events. Lenis animates the scroll position itself, so a programmatic
     or momentum scroll can land without firing an event we happen to be
     listening for — which left the frame and the caption out of sync. The
     loop only runs while the section is visible, so it costs nothing
     elsewhere on the page. */
  let visible = false, raf = 0;
  function loop() {
    tick();
    if (visible) raf = requestAnimationFrame(loop);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
    else tick();
  }, { threshold: 0 }).observe(section);

  /* Belt and braces: rAF gives smooth scrubbing while the page is actually
     rendering, and the scroll listener keeps the frame correct in the cases
     rAF is paused or IntersectionObserver never reports (backgrounded tab,
     programmatic jumps). Both are cheap; neither alone is reliable. */
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', () => { size(); tick(); });
  size();
  tick();
}

/* ============================================================
   4. MENU CUPS — the real thing on every product card
   A card cannot own a WebGLRenderer: browsers cap contexts at roughly
   eight to sixteen and a phone gives up well before fifteen. So there is
   one renderer, offscreen, and each card gets a cheap 2D canvas that the
   rendered frame is blitted into. One GPU context, N memcpys.
   ============================================================ */
function initCardCups() {
  const RW = 320, RH = 400;                       // card art is 4:5
  const dpr = Math.min(devicePixelRatio, 1.5);    // these are small; 2x is waste
  const W = Math.round(RW * dpr), H = Math.round(RH * dpr);

  const gl = document.createElement('canvas');    // never enters the DOM
  gl.width = W; gl.height = H;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: gl, alpha: true, antialias: true,
                                         powerPreference: 'low-power' });
  } catch (err) {
    /* Silent returns here cost real debugging time: the page just showed
       the flat SVG with nothing in the console to say why. */
    console.warn('[blendmandu] card cups unavailable:', err);
    return;
  }
  /* A GPU under pressure can take the context away, and three.js just
     logs it. Without this the cards would sit blank rather than falling
     back to the flat art they still have underneath. */
  gl.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    console.warn('[blendmandu] card cup context lost, falling back to flat art');
    for (const el of cards.keys()) el.classList.remove('has-cup');
    visible.clear();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  gl.addEventListener('webglcontextrestored', () => {
    cups.clear();                                 // textures died with the context
    for (const el of cards.keys()) el.classList.add('has-cup');
    scan();
  });

  renderer.setPixelRatio(1);                      // dpr is already in the backing store
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* Same light rig as the hero, so a card cup and the big one read as the
     same object rather than two different products. */
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.05); key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(0xffd9b0, 1.05); rim.position.set(-4, 1, -3);
  const fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(-2, -3, 3);
  scene.add(key, rim, fill);

  const camera = new THREE.PerspectiveCamera(34, RW / RH, 0.1, 100);
  camera.position.set(0, 0.05, 7.6 * (1 + (1 - RW / RH) * 0.55));
  camera.updateProjectionMatrix();

  /* Built on first sight, not up front: fifteen lathes and fifteen label
     textures at load would cost more than the whole rest of the page. */
  const cups = new Map();
  function cupFor(p) {
    let c = cups.get(p.id);
    if (!c) {
      c = buildCup(p, 512, 256);
      /* A tall cup plus straw reaches far higher than a shot, and the card
         camera is fixed, so the lid was being clipped off the top. Measure
         what was built and hang it on its own centre. */
      const box = new THREE.Box3().setFromObject(c);
      c.userData.cardShift = (box.max.y + box.min.y) / 2;
      cups.set(p.id, c);
    }
    return c;
  }

  const cards = new Map();      // el -> { p, ctx, canvas, phase }
  const visible = new Set();
  let raf = 0;

  const io = new IntersectionObserver(es => {
    for (const e of es) {
      if (e.isIntersecting) { mount(e.target); visible.add(e.target); }
      else visible.delete(e.target);
    }
    if (visible.size && !raf) raf = requestAnimationFrame(frame);
    if (!visible.size && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '200px' });   // start building just before it is needed

  function mount(el) {
    if (cards.has(el)) return;
    const p = PRODUCTS.find(x => x.id === el.dataset.cup);
    if (!p) { console.warn('[blendmandu] no product for data-cup', el.dataset.cup); return; }
    const c = document.createElement('canvas');
    c.className = 'cardcup';
    c.width = W; c.height = H;
    c.setAttribute('aria-hidden', 'true');
    el.appendChild(c);
    el.classList.add('has-cup');          // hides the flat SVG underneath
    cards.set(el, { p, canvas: c, ctx: c.getContext('2d'),
                    phase: (el.dataset.cup.charCodeAt(0) % 7) * 0.9 });
  }

  function drawCard(el, now) {
    const e = cards.get(el);
    if (!e) return;
    const cup = cupFor(e.p);
    scene.add(cup);
    /* Time based, not per frame, so the round robin below cannot make one
       card spin slower than another just because it is drawn less often. */
    cup.rotation.y = REDUCED ? e.phase : e.phase + now / 1000 * 0.5;
    cup.rotation.x = 0.05;
    cup.position.y = -(cup.userData.cardShift || 0);
    renderer.render(scene, camera);
    scene.remove(cup);
    e.ctx.clearRect(0, 0, W, H);
    e.ctx.drawImage(gl, 0, 0, W, H);
  }

  /* A phone can have six cards on screen. Drawing every one every frame is
     the difference between a smooth page and a hot one, so spread them. */
  const BUDGET = 4;
  let cursor = 0;
  function frame(now) {
    const list = [...visible];
    if (list.length) {
      const count = Math.min(BUDGET, list.length);
      for (let i = 0; i < count; i++) drawCard(list[(cursor + i) % list.length], now);
      cursor = (cursor + count) % list.length;
    }
    raf = visible.size ? requestAnimationFrame(frame) : 0;
  }

  /* The grid is rebuilt on every filter and search, which throws the old
     canvases away, so rebind rather than assume one pass is enough. */
  function scan() {
    for (const el of [...cards.keys()]) {
      if (!el.isConnected) { cards.delete(el); visible.delete(el); }
    }
    document.querySelectorAll('[data-cup]').forEach(el => io.observe(el));
  }
  scan();
  addEventListener('blendmandu:cards', scan);
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  try {
    THREE = await import('../vendor/three.module.js');
  } catch (err) {
    console.error('[blendmandu] three.js failed to load:', err);
    document.documentElement.classList.add('no-webgl');
  dispatchEvent(new Event('blendmandu:no-webgl'));   // app.js paints the flat cup
    return;
  }
  document.querySelectorAll('[data-webgl]').forEach(el => el.classList.add('is-live'));
  initHero();
  initSticky();
  initSequence();
  initCardCups();
}

if (webglOK()) {
  boot();
} else {
  // no WebGL: the markup already carries a static SVG fallback, and the
  // 1.2 MB library above is never requested
  document.documentElement.classList.add('no-webgl');
  dispatchEvent(new Event('blendmandu:no-webgl'));   // app.js paints the flat cup
}
