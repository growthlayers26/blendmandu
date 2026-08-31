/* Self-contained diagnostic, loaded only by /diag.html.
   Deliberately depends on nothing else in the site: if app.js, products.js
   or the service worker are the thing that is broken, this page still has
   to render and say so. */

const out = document.getElementById('rows');
const rows = [];

function row(label, value, state) {
  rows.push({ label, value: String(value), state });
  const el = document.createElement('div');
  el.className = 'row ' + (state || '');
  el.innerHTML = `<span class="k"></span><span class="v"></span>`;
  el.querySelector('.k').textContent = label;
  el.querySelector('.v').textContent = value;
  out.appendChild(el);
}

/* The version this page itself was served with, read from its own tag. */
const loadedVer = (document.querySelector('script[src*="diag.js"]') || {})
  .src?.match(/v=([a-f0-9]+)/)?.[1] || 'unknown';

(async function run() {
  /* ---------- 1. which build is this browser actually running ---------- */
  /* sw.js carries the build hash and is served must-revalidate, so a
     no-store fetch of it is the cheapest way to learn what the server
     considers current, independent of anything this page has cached. */
  let liveVer = 'could not fetch';
  try {
    const txt = await fetch('/sw.js', { cache: 'no-store' }).then(r => r.text());
    liveVer = (txt.match(/VERSION\s*=\s*"([a-f0-9]+)"/) || [])[1] || 'not found in sw.js';
  } catch (e) { liveVer = 'fetch failed: ' + e.message; }

  const stale = liveVer !== loadedVer && /^[a-f0-9]+$/.test(liveVer);
  row('Build you are running', loadedVer, stale ? 'bad' : 'ok');
  row('Build on the server', liveVer, 'ok');
  row('Serving stale files?', stale ? 'YES - this is the problem' : 'no',
      stale ? 'bad' : 'ok');

  /* ---------- 2. service worker ---------- */
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    row('Service workers registered', regs.length, regs.length ? '' : 'ok');
    row('A worker controls this page',
        navigator.serviceWorker.controller ? 'yes' : 'no', '');
    for (const r of regs) {
      const s = r.active || r.waiting || r.installing;
      row('  worker script', s ? s.scriptURL.replace(location.origin, '') : 'none', '');
      if (r.waiting) row('  worker state', 'a NEW worker is waiting to take over', 'warn');
    }
    try {
      const keys = await caches.keys();
      row('Caches stored', keys.length ? keys.join(', ') : 'none', '');
    } catch { row('Caches stored', 'unreadable', 'warn'); }
  } else {
    row('Service worker support', 'not available', 'warn');
  }

  /* ---------- 3. the settings that switch the 3D cup off ---------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  row('Reduce Motion / Low Power', reduced ? 'ON' : 'off', '');

  const conn = navigator.connection ? navigator.connection.effectiveType : 'unknown';
  row('Connection type', conn, /^(slow-)?2g$/.test(conn) ? 'bad' : 'ok');

  /* ---------- 4. can this device do WebGL at all ---------- */
  let gl = null, glErr = '';
  try {
    const c = document.createElement('canvas');
    gl = c.getContext('webgl2') || c.getContext('webgl');
  } catch (e) { glErr = e.message; }
  row('WebGL available', gl ? 'yes' : 'NO' + (glErr ? ' (' + glErr + ')' : ''),
      gl ? 'ok' : 'bad');

  if (gl) {
    let renderer = 'hidden by browser';
    try {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    } catch {}
    row('  GPU', renderer, '');
    row('  max texture size', gl.getParameter(gl.MAX_TEXTURE_SIZE), '');
  }

  /* This mirrors webglOK() in cup3d.js. Kept as its own copy on purpose:
     importing the real one would run the whole cup, and the point here is
     to report the decision, not to make it. */
  const wouldRender = !!gl && !/^(slow-)?2g$/.test(conn);
  row('Cup should render', wouldRender ? 'yes' : 'no', wouldRender ? 'ok' : 'bad');

  /* ---------- 5. does the 3D library actually load on this device ---------- */
  const t0 = performance.now();
  try {
    const mod = await import('/assets/vendor/three.module.js');
    const ms = Math.round(performance.now() - t0);
    row('three.js loaded', `yes, in ${ms} ms (r${mod.REVISION || '?'})`, 'ok');
  } catch (e) {
    row('three.js loaded', 'FAILED: ' + e.message, 'bad');
  }

  /* ---------- 6. device ---------- */
  row('Screen', `${innerWidth} x ${innerHeight} @ ${devicePixelRatio}x`, '');
  row('Memory / cores', `${navigator.deviceMemory || '?'} GB / ${navigator.hardwareConcurrency || '?'}`, '');
  row('Browser', navigator.userAgent, '');

  document.getElementById('verdict').textContent = stale
    ? 'Your phone is running an old copy. Tap Reset below.'
    : wouldRender
      ? 'This device can run the 3D cup on the current build.'
      : 'This device cannot run the 3D cup. The reason is marked in red above.';
})();

/* ---------- actions ---------- */
document.getElementById('reset').addEventListener('click', async e => {
  e.target.disabled = true;
  e.target.textContent = 'Clearing…';
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
    const keys = await caches.keys();
    for (const k of keys) await caches.delete(k);
  } catch {}
  /* Cache-bust the reload so the HTML itself cannot come from memory. */
  location.replace('/?fresh=' + Date.now());
});

document.getElementById('copy').addEventListener('click', async e => {
  const text = rows.map(r => `${r.label}: ${r.value}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    e.target.textContent = 'Copied';
  } catch {
    /* clipboard is blocked in plenty of mobile contexts; showing the text
       so it can be selected by hand is better than failing silently */
    const ta = document.getElementById('raw');
    ta.value = text;
    ta.hidden = false;
    ta.select();
    e.target.textContent = 'Select and copy above';
  }
});
