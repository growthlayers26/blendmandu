# SEO decision log

Every metadata change gets a row. Without a dated record of what changed and
when, a later ranking move cannot be attributed to anything and the whole
exercise is superstition.

| Date | Page | Change | Rationale | Impressions before | CTR before | Review on |
| ---- | ---- | ------ | --------- | ------------------ | ---------- | --------- |
| 2026-09-05 | (all) | Moved site to blendmandu.com; added geo meta; areaServed to 13 entries; removed unverifiable email and sameAs | Domain launch + local signals absent | n/a | n/a | 2026-10-03 |

## Baseline

Nothing yet. Search Console verification is pending, so there is no
impressions or CTR history for any page. First usable data is roughly
7 to 14 days after verification completes.

## Daily health check log

**2026-09-06** — No metadata change. `node check.js`: 49 pages, 0 failures,
0 warnings. Live probe of `/`, `/shop.html`, `/cart.html`, `/ne/`,
`/ne/shop.html`, `/product/acai-bowl.html`, `/sitemap.xml`, `/robots.txt` all
200. Canonical on `/` is `https://blendmandu.com/`, resolves 200 direct (not
a redirect). `www` still 308s to apex — direction has not flipped. LocalBusiness
schema parses (3 JSON-LD blocks: FoodEstablishment/LocalBusiness, WebSite,
FAQPage); no aggregateRating or review in structured data. areaServed lists
12 named Place entries plus Kathmandu city, matching all 12 SHOP.zones
neighbourhoods (Thamel, Durbar Marg, Lazimpat, Naxal, Baluwatar, Maharajgunj,
Chabahil, Baneshwor, Kalanki, Swayambhu, Gongabu, Koteshwor) exactly.
`seo/data/` has no performance export — still no Search Console CSV since
launch, so no metadata change qualifies. Standing flags unchanged and still
open: the "4.8 from 200+ orders" line on the homepage ([index.html:69](../index.html:69))
is invented, absent from schema (correct) but still live in visible copy —
remove or substantiate with real reviews. Allergen lines on all 15 products in
`assets/js/products.js` remain UNVERIFIED against the real kitchen — top
outstanding risk until the owner confirms them.
