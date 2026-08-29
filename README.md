# Blendmandu — 24/7 smoothie delivery, Kathmandu

A static storefront modelled on the structure and visual language of
brewdistrict24.com, rebuilt from scratch for a Kathmandu cloud kitchen.
No build step, no framework, no monthly fees.

```
index.html               landing page + the three motion set-pieces
shop.html                the menu (sidebar categories + product grid)
cart.html                cart + checkout, sends the order to WhatsApp
assets/css/style.css
assets/js/products.js    <- brand, phone, prices, menu live here
assets/js/app.js         <- shell, cart, checkout, reveals, menu overlay
assets/js/cup3d.js       <- WebGL cup: hero, pinned scroll, scrubbed sequence
assets/vendor/three.module.js   Three.js r160 (MIT)
assets/vendor/lenis.min.js      Lenis 1.1.18 smooth scroll (MIT)
```

## Run it locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173

## Change before you go live

Everything below is in `assets/js/products.js`, at the top:

| What | Where | Currently |
|---|---|---|
| **WhatsApp number** | `SHOP.whatsapp` | `9779800000000` — placeholder, orders go nowhere until you change it |
| Display phone | `SHOP.phone` | `+977 980-0000000` |
| Email | `SHOP.email` | `order@blendmandu.com` |
| Instagram | `SHOP.instagram` | empty link |
| Brand name | `SHOP.brand` / `brandLine1` / `brandLine2` | BLEND / MANDU |
| Delivery areas + fees | `SHOP.zones` | 3 Kathmandu zones, Rs 100–150 |
| Free-delivery threshold | `SHOP.freeDeliveryOver` | Rs 1,500 |
| Menu + prices | `PRODUCTS` | 15 items, Rs 150–590 |

The prices and the 15 menu items are **my invented placeholders** based on
typical Kathmandu pricing. Replace them with your real menu.

Product artwork is generated as inline SVG from each item's `c1`/`c2` colours —
no photos needed. Swap in real photography later by replacing the
`.card__art` contents.

## How ordering works

There is no payment gateway. Checkout collects the order, validates it,
and opens WhatsApp with the whole thing written out — items, quantities,
totals, address, landmark, timing, payment method. You confirm in chat and
collect by cash on delivery, eSewa, Khalti or Fonepay.

This is deliberate: Shopify Payments doesn't operate in Nepal, and every
Nepali gateway needs a registered business plus a server to verify callbacks.
When you're ready for that, eSewa and Khalti both have merchant APIs that
need a small backend — the checkout form is already structured to feed one.

## Deploy free

Any static host works. Cloudflare Pages and Netlify both have free tiers
that don't need a card, which matters given Nepal's forex limits on
outbound subscriptions:

```bash
npx wrangler pages deploy . --project-name blendmandu
```

Or drag the folder onto app.netlify.com/drop.

## Before launch — safety and accuracy

1. **Verify every allergen line.** `PRODUCTS[].allergens` in `products.js` was
   derived from the ingredients written for each blend, and each one now shows
   on its product page. They are consistent with the recipes as written, but
   nobody has checked them against your actual kitchen. Someone could get hurt
   if one is wrong. Check all 15 before you take an order.
2. **The kcal figures are placeholders**, as are all prices and product names.
3. **The policy pages are a starting template**, not legal advice — written for
   a Kathmandu food-delivery operation and worth a read-through before launch:
   `privacy-policy.html`, `return-policy.html`, `terms.html`, `cookies.html`.
4. **`SHOP.url`** must be your real domain, or every canonical and social tag
   points at the placeholder.

## Accessibility notes

Checkout errors set `aria-invalid` and wire an inline message through
`aria-describedby` on the field itself — a toast alone tells a screen-reader
user that *something* failed but not which field or why. Errors clear on the
next submit.

The cart totals are `role="status" aria-live="polite"`, so changing a quantity
announces the new total instead of changing it silently.

Modals (menu, delivery-area gate) set `role="dialog"`, `aria-modal`, mark the
background `inert`, trap Tab, and restore focus on close.

Touch targets are 44px minimum. `prefers-reduced-motion` disables Lenis, the
reveals and WebGL entirely (`webglOK()` returns false).

## Resilience & hardening

**Storage is always guarded.** Touching `localStorage` *throws* (it does not
return null) when site data is blocked — Safari's "Block All Cookies",
hardened privacy settings, some embedded webviews. Every access goes through
the `store` helper in `app.js`. A blocked browser loses persistence but still
gets a working shop.

**Boot runs each step in isolation.** `boot([...])` try/catches every
initialiser. Previously one throw in step 2 took the product grid, cart and
checkout with it.

**Three.js loads only if it will be used.** It is a `await import()` *inside*
the `webglOK()` branch, not a top-level import. A static import is fetched by
the preload scanner regardless — 250 KB gzipped wasted on exactly the cheap
phones the fallback exists for.

**No inline `<script>` anywhere.** Config rides on `<html data-base data-lang>`
and related products on `data-related`. That is what lets the CSP drop
`'unsafe-inline'` from `script-src`. `check.js` fails the build if an inline
script reappears.

## Deploying

**If you set `SHOP.newsletterEndpoint`**, add that host to `connect-src` in
both `_headers` and `vercel.json`. The CSP is deliberately tight, so an
un-listed host means the POST is blocked and sign-ups vanish with no error.

**The 404 page uses root-absolute paths** for exactly one reason: a 404 is
served *at* the URL that missed, so a miss at `/product/typo` would otherwise
look for `/product/assets/css/style.css`. The one page reachable from an
unknown depth cannot use relative links.

`_headers` (Cloudflare Pages, Netlify) and `vercel.json` carry the CSP, HSTS,
`X-Frame-Options`, `Referrer-Policy` and cache rules. **Other hosts need their
own config** — without it the site ships no CSP at all.

Hashed assets are set `immutable` for a year; HTML must revalidate, so a price
change lands immediately.

`sw.js` is generated by `build.js` and version-locked to the build hash:
HTML is network-first (a stale cache can never pin customers to yesterday's
prices), hashed assets cache-first, and each deploy drops the previous cache.

## Analytics (off by default)

`SHOP.analytics` in `products.js` is empty, so **no third-party script loads
and no consent banner appears**. That is what keeps the claim in
`cookies.html` true today.

Paste a GA4 or Meta Pixel ID in and the consent banner turns itself on. The
gate is real, not cosmetic: with consent denied the vendor script is never
requested at all. Verified — before consent `gtag` is `undefined` and no
`googletagmanager` script exists in the DOM.

Events fired: `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`,
`search`, `reorder`, `newsletter_signup`, `language_switch`, and
**`order_sent`** — the WhatsApp handoff. With no payment gateway there is no
server-side purchase to record, so that handoff is the closest thing to a
sale the site can observe. Treat it as an order *intent*, not a confirmed
sale, and reconcile against what the kitchen actually made.

`window.__events` holds the last 200 events in the browser, so you can debug
tracking with no vendor attached.

## Newsletter

Honeypot field plus a 2.5-second time trap, rather than reCAPTCHA — which
needs Google keys, adds a third-party dependency, and punishes people on slow
connections. Set `SHOP.newsletterEndpoint` to any URL that accepts a JSON
POST (Formspree, Brevo, Mailchimp). Left empty, the form validates and
confirms but sends nothing.

## Conversion features

| Feature | Why |
|---|---|
| Sticky cart bar | On a phone the header cart is a small target that scrolls away. This keeps the total and a real tap target on screen. Only appears once the cart has items. Turn off with `SHOP.stickyCartBar: false`. |
| Free-delivery progress | "Rs 740 to free delivery" with a filling bar — the standard lever for lifting average order value. |
| Floating WhatsApp | Plenty of people would rather message than fill a form. Forcing everyone down the cart flow loses those orders. Turn off with `SHOP.whatsappFloat: false`. |
| Order again | Last order is stored locally and offered in one tap on an empty cart — repeat business is most of a cloud kitchen's revenue. |
| Skip link + focus rings | Keyboard and screen-reader users can actually get past the masthead. |

## Languages

English at the root, Nepali under `/ne/` — the same shape the reference uses,
with reciprocal `hreflang` on every page and in the sitemap.

| File | What it holds |
|---|---|
| `assets/js/i18n.js` | 113 UI strings × 2 languages (`en`, `ne`) |
| `assets/js/products.js` | `PRODUCT_I18N` — Nepali blurb, meta, allergens, tag per product |
| `content.js` | contact / 404 / policy page copy, both languages |
| `ne-copy.js` | Nepali copy for the three hand-written pages |

The language code is **`ne`** (ISO 639-1 for Nepali). `np` is the *country*
code and would make every hreflang tag invalid.

Product **names stay in English** in both languages on purpose — customers
order by name over WhatsApp and a Nepali-only name confuses the kitchen.
Prices use Western numerals in both, matching eSewa/Khalti.

`ne-copy.js` has a `requiredIn` list: if you reword the English page and forget
the Nepali, **the build fails** rather than shipping a half-translated page.

> The Nepali should be read by a native speaker before launch. It is careful,
> but it is not a substitute for a person.

## Build step

The site now has one, because crawlers and WhatsApp don't run JavaScript —
`og:` tags and JSON-LD have to be in the HTML as served.

```bash
node build.js    # regenerate product pages, sitemap, robots, manifest, policies
node check.js    # validate every page: social tags, links, canonicals
```

Run `build.js` after **any** edit to `products.js` or the page copy. It also
stamps a content hash onto every CSS/JS URL, so customers never get a stale
cached bundle after you deploy.

## The motion layer

Modelled on the reference build, which runs GSAP + Lenis + Three.js.

| Piece | What it does |
|---|---|
| Hero cup (`#cup-hero`) | WebGL. Drag to spin, click to change flavour. Cup, label, price, cart button and the **whole page colour** swap per flavour. |
| Pinned section (`#pin`) | A second WebGL cup, pinned for 300vh while scroll drives its rotation and steps through three captions. |
| Sequence (`#seq`) | A 60-frame 2D canvas animation scrubbed by scroll: fruit drops, blends, pours. |
| Marching dots | Every dotted rule animates, like their `dottedLineAnim`. |
| Scroll reveals | Sections and cards fade up with a stagger. |
| Menu overlay | Full-screen, staggered links. |
| Lenis | Inertial smooth scroll, desktop only. |

The cup is **procedural** — geometry lathed from a profile curve, label drawn
into a canvas at runtime. There is no 3D model or texture file to manage, so
changing a flavour colour in `PRODUCTS` restyles the 3D cup automatically.

**It degrades on purpose.** `webglOK()` in `cup3d.js` refuses WebGL on devices
reporting under 3GB RAM, under 4 cores, or a 2G connection, and the page falls
back to the flat SVG art with the pinned sections unpinned. `prefers-reduced-motion`
disables all of it. This matters more in Kathmandu than the animation does.

To turn the 3D off entirely, drop the `cup3d.js` script tag from `index.html`.

## Known limits

- The menu renders in JavaScript, so search engines index it less well than
  plain HTML. Fine while traffic comes from Instagram and WhatsApp; worth
  revisiting if you want Google traffic.
- Cart lives in the browser's localStorage — it is per-device and clears if
  the customer wipes site data.
- The newsletter box is a stub. Point it at Mailchimp/Brevo when you want it.
- Three.js is vendored unminified (1.2MB, ~150KB gzipped). Any host with gzip
  or brotli on — Cloudflare Pages and Netlify both do by default — makes this a
  non-issue. It only loads on `index.html`.
