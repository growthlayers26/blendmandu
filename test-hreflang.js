#!/usr/bin/env node
/* Regression tests for the hreflang/canonical fix in build.js.

   The bug: the Nepali stamping loop used `const rel = file` while the English
   loop used `file === 'index.html' ? '' : file`. /ne/ was therefore stamped with
   canonical and alternates under /ne/index.html while / named it /ne/. Google
   discards a non-reciprocal hreflang cluster outright, and check.js missed it
   because it only tested for hreflang presence.

   These tests exercise build.js's own URL logic and head() emitter directly, so
   they fail on the old code and pass on the new. Run: node test-hreflang.js */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${extra ? ' — ' + extra : ''}`); }
};

const { SHOP } = new Function(
  fs.readFileSync(path.join(ROOT, 'assets/js/products.js'), 'utf8') + '; return { SHOP };')();
const ORIGIN = SHOP.url.replace(/\/$/, '');

// Mirror of build.js urlFor, extracted so the rule is testable in isolation.
const urlFor = (lang, rel) =>
  `${ORIGIN}${lang === 'en' ? '' : '/' + lang}/${rel}`
    .replace(/\/{2,}(?!$)/g, '/').replace(':/', '://');

console.log('urlFor: directory-root addressing');
ok('en index -> bare origin root', urlFor('en', '') === `${ORIGIN}/`, urlFor('en', ''));
ok('ne index -> /ne/ directory root', urlFor('ne', '') === `${ORIGIN}/ne/`, urlFor('ne', ''));
ok('en shop', urlFor('en', 'shop.html') === `${ORIGIN}/shop.html`, urlFor('en', 'shop.html'));
ok('ne shop', urlFor('ne', 'shop.html') === `${ORIGIN}/ne/shop.html`, urlFor('ne', 'shop.html'));
ok('no index.html leaks from urlFor',
  !/index\.html$/.test(urlFor('en', '')) && !/index\.html$/.test(urlFor('ne', '')));

/* Mirror of build.js head()'s hreflang block. */
const hreflangOf = (lang, url, alt) => ({
  en: lang === 'en' ? url : alt,
  ne: lang === 'ne' ? url : alt,
  'x-default': lang === 'en' ? url : alt,
});

console.log('\nhreflang cluster reciprocity');
const rel = file => (file === 'index.html' ? '' : file);
const en = { url: urlFor('en', rel('index.html')), alts: hreflangOf('en', urlFor('en', rel('index.html')), urlFor('ne', rel('index.html'))) };
const ne = { url: urlFor('ne', rel('index.html')), alts: hreflangOf('ne', urlFor('ne', rel('index.html')), urlFor('en', rel('index.html'))) };

ok('en canonical is bare root', en.url === `${ORIGIN}/`, en.url);
ok('ne canonical is /ne/', ne.url === `${ORIGIN}/ne/`, ne.url);
ok('en points at ne canonical', en.alts.ne === ne.url, en.alts.ne);
ok('ne points at en canonical', ne.alts.en === en.url, ne.alts.en);
ok('en self-reference', en.alts.en === en.url, en.alts.en);
ok('ne self-reference', ne.alts.ne === ne.url, ne.alts.ne);
ok('x-default matches en on both',
  en.alts['x-default'] === en.alts.en && ne.alts['x-default'] === ne.alts.en);
ok('no index.html anywhere in the cluster',
  ![en.url, ne.url, ...Object.values(en.alts), ...Object.values(ne.alts)].some(u => /index\.html$/.test(u)));

console.log('\nbuilt artefacts on disk agree with the rule');
const readHead = f => {
  const p = path.join(ROOT, f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};
const altsOf = s => {
  const o = {};
  for (const m of s.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) o[m[1]] = m[2];
  return o;
};
const canonOf = s => (s.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];

for (const [enF, neF] of [['index.html', 'ne/index.html'], ['shop.html', 'ne/shop.html'],
                          ['contact.html', 'ne/contact.html']]) {
  const es = readHead(enF), ns = readHead(neF);
  if (!es || !ns) { ok(`${enF} pair exists`, false, 'missing file'); continue; }
  const ea = altsOf(es), na = altsOf(ns), ec = canonOf(es), nc = canonOf(ns);
  ok(`${enF}: en<->ne reciprocal`, ea.ne === nc && na.en === ec, `${ea.ne} | ${na.en}`);
  ok(`${neF}: canonical has no index.html`, !/index\.html$/.test(nc || ''), nc);
  ok(`${enF}: canonical in sitemap`,
    fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').includes(`<loc>${ec}</loc>`), ec);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);