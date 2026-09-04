#!/usr/bin/env node
/* Static sanity check across every generated page.
   Catches the boring failures that cost money: missing social tags,
   broken internal links, double-escaped entities, absent canonicals. */
const fs = require('fs');
const path = require('path');

/* Read the declared site origin from the same place build.js does, so the
   origin rule below can compare pages against it rather than only against
   each other. products.js is a browser script, so evaluate it for SHOP. */
const { SHOP } = new Function(
  fs.readFileSync('assets/js/products.js', 'utf8') + '; return { SHOP };')();
const ORIGIN = SHOP.url.replace(/\/$/, '');

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'assets') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) pages.push(full.replace(/^\.\//, ''));
  }
})('.');

let fail = 0, warn = 0;
const bad = (f, m) => { console.log(`  FAIL ${f}: ${m}`); fail++; };
const meh = (f, m) => { console.log(`  warn ${f}: ${m}`); warn++; };

for (const f of pages) {
  const s = fs.readFileSync(f, 'utf8');
  const noindex = /name="robots" content="noindex"/.test(s);

  if (!/<title>.+<\/title>/.test(s)) bad(f, 'no <title>');
  if (!/name="description"/.test(s)) bad(f, 'no meta description');
  if (!/property="og:title"/.test(s)) bad(f, 'no og:title');
  if (!/property="og:image"/.test(s)) bad(f, 'no og:image');
  if (!/name="twitter:card"/.test(s)) bad(f, 'no twitter:card');
  if (!noindex && !/rel="canonical"/.test(s)) bad(f, 'no canonical');
  if (!/rel="manifest"/.test(s)) bad(f, 'no manifest link');
  if (!/name="theme-color"/.test(s)) bad(f, 'no theme-color');
  if (!noindex) {
    if (!/hreflang="en"/.test(s) || !/hreflang="ne"/.test(s)) bad(f, 'missing hreflang pair');
    if (!/hreflang="x-default"/.test(s)) bad(f, 'no x-default');
  }
  const isNe = f.startsWith('ne/') || f.startsWith('ne\\');
  const htmlLang = (s.match(/<html lang="([^"]+)"/) || [])[1];
  if (isNe && htmlLang !== 'ne-NP') bad(f, `ne page has lang="${htmlLang}"`);
  if (!isNe && htmlLang !== 'en') bad(f, `en page has lang="${htmlLang}"`);
  // config now rides on <html data-*>, so there is no inline script to duplicate
  if (/<script>\s*window\.__/.test(s)) bad(f, 'inline bootstrap script present (breaks strict CSP)');
  const declared = (s.match(/<html[^>]*data-lang="([^"]*)"/) || [])[1];
  if (isNe && declared !== 'ne') bad(f, `ne page declares __LANG__="${declared}"`);
  if (!isNe && declared !== 'en') bad(f, `en page declares __LANG__="${declared}"`);

  // double-escaped entities render as literal "&AMP;"
  if (/&amp;(amp|lt|gt|quot|middot|copy|mdash|ndash);/i.test(s)) bad(f, 'double-escaped entity');

  const inlineExec = (s.match(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g) || []);
  if (inlineExec.length) bad(f, `${inlineExec.length} inline <script> block(s) — strict CSP would block them`);

  /* A 404 is served AT the URL that missed, so every path on it must be
     root-absolute or it breaks at any depth other than the root. */
  if (/(^|\/)404\.html$/.test(f)) {
    const rel = [...s.matchAll(/(?:href|src)="([^"]+)"/g)]
      .map(m => m[1])
      .filter(h => !/^(https?:|mailto:|tel:|data:|#|\/)/.test(h));
    if (rel.length) bad(f, `404 has ${rel.length} relative path(s) — breaks at depth: ${rel.slice(0,3).join(', ')}`);
    if (!/data-base="\//.test(s)) bad(f, '404 must set an absolute data-base');
  }

  /* A page carrying two different ?v= hashes means something fell out of the
     stamping pass and returning visitors keep a stale copy of it. */
  const vers = [...new Set([...s.matchAll(/\?v=([a-f0-9]+)/g)].map(m => m[1]))];
  if (vers.length > 1) bad(f, `mixed asset versions: ${vers.join(', ')}`);

  /* Every absolute URL the page declares about itself must share one
     origin. A canonical or og:image left on an old domain 404s in link
     previews and tells search engines the wrong home. */
  const origins = new Set();
  for (const m of s.matchAll(/(?:rel="canonical" href|property="og:(?:url|image)" content|name="twitter:image" content|rel="alternate" hreflang="[^"]*" href)="(https?:\/\/[^\/"]+)/g))
    origins.add(m[1]);
  if (origins.size > 1) bad(f, `mixed self-referential origins: ${[...origins].join(', ')}`);
  /* Self-consistency is not enough: a page can be uniformly wrong. Every
     absolute self-reference must match the origin the build declares, which
     is what caught diag.html still on the old vercel.app host after the
     domain move. */
  for (const o of origins) if (o !== ORIGIN) bad(f, `self-referential origin ${o} is not the site origin ${ORIGIN}`);

  // internal links must resolve to a real file
  const dir = path.dirname(f);
  for (const m of s.matchAll(/(?:href|src)="([^"#?:][^"]*?)(?:[?#][^"]*)?"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(href)) continue;
    const target = href.startsWith('/')
      ? path.join('.', href.slice(1))
      : path.join(dir, href);
    if (!fs.existsSync(target)) bad(f, `broken link -> ${href}`);
  }

  const title = (s.match(/<title>(.*?)<\/title>/) || [])[1] || '';
  if (title.length > 65) meh(f, `title ${title.length} chars (Google truncates ~60)`);
  const desc = (s.match(/name="description" content="(.*?)"/) || [])[1] || '';
  if (desc.length > 165) meh(f, `description ${desc.length} chars`);
  if (desc && desc.length < 50) meh(f, `description only ${desc.length} chars`);
}

// required root assets
for (const f of ['og-image.png','favicon.ico','favicon.svg','apple-touch-icon.png',
                 'icon-192.png','icon-512.png','site.webmanifest','robots.txt','sitemap.xml'])
  if (!fs.existsSync(f)) bad('(root)', `missing ${f}`);

console.log(`\n${pages.length} pages checked — ${fail} failures, ${warn} warnings`);
process.exit(fail ? 1 : 0);
