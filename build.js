#!/usr/bin/env node
/* ============================================================
   Blendmandu static generator

   Derives everything that must exist as a REAL file for crawlers
   and link unfurlers: product pages, sitemap, robots, manifest.

   Client-side rendering can't do this job — WhatsApp and Google
   don't run your JavaScript, so og:tags and JSON-LD have to be
   in the HTML as served.

   Run after editing assets/js/products.js:   node build.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('assets/js/products.js', 'utf8');
const { SHOP, PRODUCTS, CATEGORIES, productArt, PRODUCT_I18N, CATEGORY_I18N } =
  new Function(src + '; return {SHOP,PRODUCTS,CATEGORIES,productArt,PRODUCT_I18N,CATEGORY_I18N};')();

const { I18N, LANGS } = require('./assets/js/i18n.js');
const FAQ = require('./faq.js');
const LANGCODES = ['en', 'ne'];

/* server-side translate: same contract as the runtime t() */
function T(lang, key, vars) {
  let out = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  if (vars) for (const k in vars) out = out.split(`{${k}}`).join(vars[k]);
  return out;
}
const trField = (lang, id, field, fb) =>
  (PRODUCT_I18N[lang] && PRODUCT_I18N[lang][id] && PRODUCT_I18N[lang][id][field]) || fb;
const catLabel = (lang, c) =>
  (c && CATEGORY_I18N[lang] && CATEGORY_I18N[lang][c.id]) || (c ? c.label : '');

/* en lives at the root, ne under /ne/ — the shape the reference uses */
const dirFor  = lang => (lang === 'en' ? '.' : lang);
const urlFor  = (lang, rel) => `${ORIGIN}${lang === 'en' ? '' : '/' + lang}/${rel}`.replace(/\/{2,}(?!$)/g, '/').replace(':/', '://');

const ORIGIN = SHOP.url.replace(/\/$/, '');

/* Content hash for cache busting. Without it a browser happily serves
   yesterday's app.js after a deploy — customers see a stale shop and you
   get bug reports for bugs you already fixed. */
const crypto = require('crypto');
const VER = crypto.createHash('sha1').update(
  ['assets/css/style.css','assets/js/app.js','assets/js/products.js','assets/js/cup3d.js',
   'assets/js/i18n.js','assets/js/analytics.js']
    .map(f => fs.readFileSync(f)).join('')
).digest('hex').slice(0, 8);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money = n => `${SHOP.currency} ${n.toLocaleString('en-IN')}`;

/* ---------- shared head ---------- */
function head({ title, desc, url, ogtype = 'website', base = '', extra = '', lang = 'en', alt = '' }) {
  const hreflang = alt ? `
<link rel="alternate" hreflang="en" href="${lang === 'en' ? url : alt}">
<link rel="alternate" hreflang="ne" href="${lang === 'ne' ? url : alt}">
<link rel="alternate" hreflang="x-default" href="${lang === 'en' ? url : alt}">` : '';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">${hreflang}

<meta property="og:type" content="${ogtype}">
<meta property="og:site_name" content="Blendmandu">
<meta property="og:locale" content="${lang === 'ne' ? 'ne_NP' : 'en_NP'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-image.png">

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#f8f7e5">
<meta name="msapplication-TileColor" content="#ff834f">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Righteous&family=Eczar:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/css/style.css?v=${VER}">${extra}`;
}

/* assetBase = hops to the SITE root (where /assets lives)
   linkBase   = hops to the LANGUAGE root (where index.html lives)
   On /ne/product/x.html those differ: '../../' vs '../'. Using one for
   both is what sends a Nepali nav link back into the English tree. */
/* No inline <script> anywhere: config rides on <html data-*> instead.
   That is what lets the CSP drop 'unsafe-inline' from script-src, which
   is the difference between a CSP that stops injected script and one
   that only looks like it does. */
const scripts = assetBase =>
`<script src="${assetBase}assets/vendor/lenis.min.js"></script>
<script src="${assetBase}assets/js/i18n.js?v=${VER}"></script>
<script src="${assetBase}assets/js/products.js?v=${VER}"></script>
<script src="${assetBase}assets/js/analytics.js?v=${VER}"></script>
<script src="${assetBase}assets/js/app.js?v=${VER}"></script>`;

const SCHEMA = require('./schema.js')({
  SHOP, ORIGIN, urlFor, T, money, PRODUCTS, CATEGORIES, catLabel, FAQ,
});

const ldTag = obj => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

/* visible FAQ markup, generated from the same source as the schema */
const faqHTML = lang => FAQ[lang].map(([q, a]) => `
      <details class="faq__item">
        <summary class="faq__q">${esc(q)}</summary>
        <div class="faq__a"><p>${esc(a)}</p></div>
      </details>`).join('');

/* insert site-level structured data + the FAQ body into a hand-written page */
function enrich(t, file, lang) {
  const blocks = [];
  if (file === 'index.html') {
    blocks.push(SCHEMA.business(lang), SCHEMA.website(lang), SCHEMA.faq(lang));
    t = t.replace(/<div class="faq" id="faq"><\/div>/,
                  `<div class="faq" id="faq">${faqHTML(lang)}\n    </div>`);
    t = t.replace(/(<p class="eyebrow eyebrow--accent" data-faq-eyebrow>)[^<]*/,
                  `$1${esc(T(lang, 'faq.eyebrow'))}`);
    t = t.replace(/(<h2 data-faq-title>)[^<]*/, `$1${esc(T(lang, 'faq.title'))}`);
  }
  if (file === 'shop.html') blocks.push(SCHEMA.menu(lang), SCHEMA.website(lang));
  if (file === 'contact.html') blocks.push(SCHEMA.contactPage(lang));

  if (blocks.length) {
    t = t.replace(/\n?<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    t = t.replace('</head>', blocks.map(ldTag).join('\n') + '\n</head>');
  }
  return t;
}

/* ---------- product detail pages (one tree per language) ---------- */
for (const lang of LANGCODES) {
  const dir = path.join(dirFor(lang), 'product');
  fs.mkdirSync(dir, { recursive: true });
  const assetBase = lang === 'en' ? '../' : '../../';
  const linkBase  = '../';

  for (const p of PRODUCTS) {
    const url = urlFor(lang, `product/${p.id}.html`);
    const alt = urlFor(lang === 'en' ? 'ne' : 'en', `product/${p.id}.html`);
    const cat = CATEGORIES.find(c => c.id === p.cat);
    const catName = catLabel(lang, cat);

    const blurb = trField(lang, p.id, 'blurb', p.blurb);
    const meta  = trField(lang, p.id, 'meta',  p.meta);
    const alrg  = trField(lang, p.id, 'allergens', p.allergens);
    const tag   = trField(lang, p.id, 'tag', p.tag);

    const desc = `${blurb} ${meta}. ${money(p.price)}.`;
    const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 3);

    const jsonld = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name, description: blurb, sku: p.id.toUpperCase(),
      category: catName,
      brand: { '@type': 'Brand', name: SHOP.brand },
      image: `${ORIGIN}/og-image.png`,
      offers: {
        '@type': 'Offer', url, price: String(p.price), priceCurrency: 'NPR',
        availability: 'https://schema.org/InStock',
        areaServed: { '@type': 'City', name: 'Kathmandu' },
        seller: { '@type': 'Organization', name: SHOP.brand },
      },
    };
    const breadcrumb = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: T(lang, 'nav.home'), item: urlFor(lang, '') },
        { '@type': 'ListItem', position: 2, name: T(lang, 'nav.menu'), item: urlFor(lang, 'shop.html') },
        { '@type': 'ListItem', position: 3, name: p.name, item: url },
      ],
    };

    const html = `<!doctype html>
<html lang="${LANGS[lang].htmlLang}" data-base="${linkBase}" data-lang="${lang}">
<head>
${head({ title: `${p.name} — ${money(p.price)} | Blendmandu`, desc, url, ogtype: 'product', base: assetBase, lang, alt,
  extra: `\n<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>` })}
</head>
<body>

<main class="shell section">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="${linkBase}index.html">${T(lang, 'nav.home')}</a> <span aria-hidden="true">/</span>
    <a href="${linkBase}shop.html">${T(lang, 'nav.menu')}</a> <span aria-hidden="true">/</span>
    <a href="${linkBase}shop.html#${p.cat}">${esc(catName)}</a> <span aria-hidden="true">/</span>
    <span aria-current="page">${esc(p.name)}</span>
  </nav>

  <div class="pdp">
    <div class="pdp__art">
      ${tag ? `<span class="card__tag">${esc(tag)}</span>` : ''}
      ${productArt(p)}
    </div>

    <div class="pdp__info">
      <p class="eyebrow eyebrow--accent">${esc(catName)}</p>
      <h1>${esc(p.name)}</h1>
      <p class="meta pdp__meta">${esc(meta)} &middot; SKU ${p.id.toUpperCase()}</p>
      <p class="lede">${esc(blurb)}</p>

      <p class="pdp__price">${money(p.price)}</p>

      <div class="pdp__buy">
        <span class="qty">
          <button type="button" data-pdp-dec aria-label="${T(lang, 'cart.decrease')}">&minus;</button>
          <span id="pdp-qty">1</span>
          <button type="button" data-pdp-inc aria-label="${T(lang, 'cart.increase')}">+</button>
        </span>
        <button class="pill pill--accent" data-add="${p.id}" data-qty-from="#pdp-qty">${T(lang, 'product.add')}</button>
      </div>

      <dl class="pdp__facts">
        <div><dt>${T(lang, 'product.allergens')}</dt><dd>${esc(alrg || T(lang, 'product.ask'))}</dd></div>
        <div><dt>${T(lang, 'product.delivery')}</dt><dd>${T(lang, 'product.deliveryVal', { amount: money(SHOP.freeDeliveryOver) })}</dd></div>
        <div><dt>${T(lang, 'product.made')}</dt><dd>${T(lang, 'product.madeVal')}</dd></div>
      </dl>

      <p class="field__hint">${T(lang, 'product.askAllergy')} <a href="https://wa.me/${SHOP.whatsapp}">${T(lang, 'product.askAllergyLink')}</a> ${T(lang, 'product.askAllergyEnd')}</p>
    </div>
  </div>

  ${related.length ? `
  <hr class="hr-dash" style="margin:52px 0 34px">
  <h2>${esc(T(lang, 'product.more', { category: catName.toLowerCase() }))}</h2>
  <div class="grid" id="related" style="margin-top:24px"
       data-related="${related.map(r => r.id).join(',')}"></div>` : ''}
</main>

${scripts(assetBase)}
</body>
</html>
`;
    fs.writeFileSync(path.join(dir, `${p.id}.html`), html);
  }
}
console.log(`product pages: ${PRODUCTS.length * LANGCODES.length} (${LANGCODES.join(', ')})`);

/* ---------- sitemap ---------- */
const today = new Date().toISOString().slice(0, 10);
const routes = [
  { rel: 'index.html', pri: '1.0', freq: 'weekly' },
  { rel: 'shop.html', pri: '0.9', freq: 'weekly' },
  { rel: 'contact.html', pri: '0.5', freq: 'monthly' },
  { rel: 'privacy-policy.html', pri: '0.3', freq: 'yearly' },
  { rel: 'return-policy.html', pri: '0.3', freq: 'yearly' },
  { rel: 'terms.html', pri: '0.3', freq: 'yearly' },
  { rel: 'cookies.html', pri: '0.3', freq: 'yearly' },
  ...PRODUCTS.map(p => ({ rel: `product/${p.id}.html`, pri: '0.8', freq: 'weekly' })),
];

/* Every route is listed once per language, and each entry declares the
   full set of alternates — that is what Google requires for hreflang to
   be honoured rather than ignored. */
const entries = [];
for (const lang of LANGCODES) {
  for (const r of routes) {
    const loc = urlFor(lang, r.rel === 'index.html' ? '' : r.rel);
    const alts = LANGCODES.map(l => ({
      lang: l, href: urlFor(l, r.rel === 'index.html' ? '' : r.rel),
    }));
    entries.push({ loc, ...r, alts });
  }
}

fs.writeFileSync('sitemap.xml',
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
${u.alts.map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${u.alts[0].href}"/>
  </url>`).join('\n')}
</urlset>
`);
console.log(`sitemap: ${entries.length} urls (${LANGCODES.length} languages)`);

/* ---------- robots ---------- */
fs.writeFileSync('robots.txt',
`User-agent: *
Allow: /
Disallow: /cart.html

Sitemap: ${ORIGIN}/sitemap.xml
`);

/* ---------- webmanifest ---------- */
fs.writeFileSync('site.webmanifest', JSON.stringify({
  name: `${SHOP.brand} — smoothies delivered 24/7 in Kathmandu`,
  short_name: SHOP.brand,
  description: 'Smoothies, acai bowls, cold-pressed juice and wellness shots, blended to order and delivered any hour across Kathmandu.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#f8f7e5',
  theme_color: '#f8f7e5',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

console.log('robots.txt, site.webmanifest written');


/* ============================================================
   CONTENT PAGES — copy lives in content.js, one entry per language
   ============================================================ */
const wa = `https://wa.me/${SHOP.whatsapp}`;
const CONTENT = require('./content.js')({
  wa, phone: SHOP.phone, email: SHOP.email,
  instagram: SHOP.instagram, freeOver: money(SHOP.freeDeliveryOver),
});

let contentCount = 0;
for (const lang of LANGCODES) {
  const dir = dirFor(lang);
  const assetBase = lang === 'en' ? '' : '../';
  const linkBase  = '';
  fs.mkdirSync(dir, { recursive: true });

  for (const key of Object.keys(CONTENT)) {
    const c = CONTENT[key][lang];
    if (!c) throw new Error(`content.js: missing "${lang}" for "${key}"`);
    const url = urlFor(lang, c.file);
    const alt = urlFor(lang === 'en' ? 'ne' : 'en', c.file);

    /* A 404 is served AT the missing URL, so relative paths resolve against
       whatever the visitor mistyped: /product/typo would look for
       /product/assets/css/style.css and /product/shop.html. The one page
       guaranteed to be reached from an unknown depth must be absolute. */
    const is404 = key === 'notfound';
    const aBase = is404 ? '/' : assetBase;
    const lBase = is404 ? (lang === 'en' ? '/' : '/ne/') : linkBase;

    const html = `<!doctype html>
<html lang="${LANGS[lang].htmlLang}" data-base="${lBase}" data-lang="${lang}">
<head>
${head({ title: c.title, desc: c.desc, url, base: aBase, lang, alt })}${c.noindex ? '\n<meta name="robots" content="noindex">' : ''}${key === 'contact' ? '\n' + ldTag(SCHEMA.contactPage(lang)) : ''}
</head>
<body>
<main class="shell section prose">
  <p class="eyebrow eyebrow--accent">${esc(c.eyebrow)}</p>
  <h1>${esc(c.h1)}</h1>
${c.body}
</main>
${scripts(aBase)}
</body>
</html>
`;
    fs.writeFileSync(path.join(dir, c.file), html);
    contentCount++;
  }
}
console.log(`content pages: ${contentCount}`);

/* ============================================================
   ENGLISH index / shop / cart
   These three are hand-written, so the builder still has to give them
   what the generated pages get for free: hreflang, __LANG__, and the
   i18n bundle (without which every t() call throws).
   ============================================================ */
for (const file of ['index.html', 'shop.html', 'cart.html']) {
  if (!fs.existsSync(file)) continue;
  let t = fs.readFileSync(file, 'utf8');

  const url = urlFor('en', file === 'index.html' ? '' : file);
  const alt = urlFor('ne', file === 'index.html' ? '' : file);

  t = t.replace(/<html[^>]*>/, '<html lang="en" data-base="" data-lang="en">');

  /* Rebuild the whole head from head(), exactly as the generated pages do.
     Previously this pass only injected hreflang, so the canonical, og:url
     and og:image on these three hand-written pages kept whatever absolute
     URL was typed into them — changing SHOP.url silently updated the
     sitemap and every generated page but left the homepage pointing at a
     domain that no longer resolves, breaking its social preview. */
  const title = (t.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Blendmandu';
  const desc = (t.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const noindex = /name="robots" content="noindex"/.test(t);
  t = t.replace(/<head>[\s\S]*?<\/head>/,
    '<head>\n' + head({ title, desc, url, base: '', lang: 'en', alt })
    + (noindex ? '\n<meta name="robots" content="noindex">' : '')
    + '\n</head>');

  // strip the old inline bootstrap script entirely
  t = t.replace(/<script>window\.__BASE__[^<]*<\/script>\n?/g, '');

  // load i18n before products/app
  if (!/assets\/js\/i18n\.js/.test(t)) {
    t = t.replace(/<script src="assets\/js\/products\.js/,
                  `<script src="assets/js/i18n.js?v=${VER}"></script>\n<script src="assets/js/products.js`);
  }
  if (!/assets\/js\/analytics\.js/.test(t)) {
    t = t.replace(/<script src="assets\/js\/app\.js/,
                  `<script src="assets/js/analytics.js?v=${VER}"></script>\n<script src="assets/js/app.js`);
  }

  t = enrich(t, file, 'en');
  fs.writeFileSync(file, t);
}
console.log('english index/shop/cart stamped');

/* ============================================================
   SERVICE WORKER
   The manifest promises display:standalone; without a worker that is a
   promise the site cannot keep — an installed icon that dies offline.

   Deliberately conservative:
     - HTML is network-first, so a menu or price change lands immediately
       and a stale cache can never pin customers to yesterday's prices.
     - Hashed assets are cache-first; the ?v= hash makes that safe.
     - The cache name carries the build hash, so every deploy drops the
       previous cache instead of accumulating them.
   ============================================================ */
const SW_ASSETS = [
  'assets/css/style.css', 'assets/js/app.js', 'assets/js/products.js',
  'assets/js/i18n.js', 'assets/js/analytics.js',
].map(f => `/${f}?v=${VER}`).concat([
  '/assets/vendor/lenis.min.js', '/favicon.svg', '/icon-192.png', '/icon-512.png',
  // Without an HTML entry the offline fallback below can never resolve —
  // the worker would answer a navigation with undefined and the browser
  // would show its own network error.
  '/index.html', '/ne/index.html',
]);

fs.writeFileSync('sw.js', `/* generated by build.js — do not edit */
const VERSION = ${JSON.stringify(VER)};
const CACHE = 'blendmandu-' + VERSION;
const PRECACHE = ${JSON.stringify(SW_ASSETS, null, 2)};

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // never touch fonts/analytics

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // network-first: prices and the menu must never be served stale
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          if (hit) return hit;
          // fall back to the shell for the language the visitor is in
          const shell = new URL(req.url).pathname.startsWith('/ne/')
            ? '/ne/index.html' : '/index.html';
          return (await caches.match(shell)) ||
            new Response('<h1>Offline</h1><p>Reconnect and reload.</p>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        })
    );
    return;
  }

  /* Cache-first is safe for hashed assets because the URL changes when the
     file does. But only store entries matching THIS build: a long-lived
     version otherwise accumulates every superseded ?v= asset forever. */
  const v = url.searchParams.get('v');
  const storable = !v || v === VERSION;

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && storable) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => Response.error()))   // never settle respondWith with undefined
  );
});
`);
console.log('sw.js written');

/* ============================================================
   NEPALI index / shop / cart
   Generated from the English source so the markup can never drift.
   Every prose string must be listed below — an unlisted string is a
   build error, not a silently half-translated page.
   ============================================================ */
const NE_COPY = require('./ne-copy.js');

for (const file of ['index.html', 'shop.html', 'cart.html']) {
  if (!fs.existsSync(file)) continue;
  let t = fs.readFileSync(file, 'utf8');

  // rewrite the head for Nepali
  const rel = file;
  const url = urlFor('ne', rel);
  const alt = urlFor('en', rel);
  const meta = NE_COPY.meta[file];
  if (!meta) throw new Error(`ne-copy.js: no meta for ${file}`);

  t = t.replace(/<html[^>]*>/, `<html lang="${LANGS.ne.htmlLang}" data-base="" data-lang="ne">`);
  t = t.replace(/<head>[\s\S]*?<\/head>/,
    '<head>\n' + head({ title: meta.title, desc: meta.desc, url, base: '../', lang: 'ne', alt })
    + (/name="robots" content="noindex"/.test(t) ? '\n<meta name="robots" content="noindex">' : '')
    + '\n</head>');

  // asset + internal paths move one level down
  t = t.replace(/(src|href)="assets\//g, '$1="../assets/');
  t = t.replace(/(href|src)="(index|shop|cart|contact|404|privacy-policy|return-policy|terms|cookies)\.html/g, '$1="$2.html');
  t = t.replace(/<script>window\.__BASE__[^<]*<\/script>\n?/g, '');

  // prose
  let missed = [];
  for (const [en, ne] of NE_COPY.strings) {
    if (t.includes(en)) t = t.split(en).join(ne);
    else missed.push(en);
  }
  const required = NE_COPY.requiredIn[file] || [];
  const reallyMissing = missed.filter(m => required.includes(m));
  if (reallyMissing.length)
    throw new Error(`ne-copy.js: strings not found in ${file}:\n  ` + reallyMissing.join('\n  '));

  t = enrich(t, file, 'ne');
  fs.mkdirSync('ne', { recursive: true });
  fs.writeFileSync(path.join('ne', file), t);
}
console.log('nepali index/shop/cart written');


/* ---------- stamp EVERY page with the current version ----------
   This must walk the whole tree, not a hand-maintained list. The Nepali
   pages are copied from the English ones before this runs, so listing only
   root files left /ne/ pinned to whatever hash it was built with — the
   exact stale-cache bug the hashing exists to prevent. */
(function stampAll(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'assets') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { stampAll(full); continue; }
    if (!e.name.endsWith('.html')) continue;
    let t = fs.readFileSync(full, 'utf8');
    const out = t.replace(/(assets\/(?:css\/[\w-]+\.css|js\/[\w-]+\.js))(\?v=[a-f0-9]+)?/g, `$1?v=${VER}`);
    if (out !== t) fs.writeFileSync(full, out);
  }
})('.');
console.log(`asset version: ${VER}`);
