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

**2026-09-08** — No metadata change. `node check.js`: 49 pages, 0 failures,
0 warnings. Live probe of `/`, `/shop.html`, `/cart.html`, `/ne/`,
`/ne/shop.html`, `/product/acai-bowl.html`, `/sitemap.xml`, `/robots.txt` all
200. Canonical on `/` is `https://blendmandu.com/`, resolves 200 direct (not
a redirect). `www` still 308s to apex, direction unchanged. Schema still 3
JSON-LD blocks (LocalBusiness/FoodEstablishment, WebSite, FAQPage), no
aggregateRating. Live `areaServed` still lists Kathmandu city plus 12 named
Place entries matching all 12 SHOP.zones neighbourhoods exactly.
`seo/data/` now has `gsc_latest.json` (a Composio Google Search Console
connection, not the manual CSV export the playbook expects) reporting 0
impressions/0 clicks site-wide since connecting. Not treated as a valid
performance source today — wrong shape for the per-page 200-impression /
CTR-vs-benchmark gate, and even at face value 0 impressions clears no page
for a metadata change regardless. No metadata change made.

The good news first: the "4.8 from 200+ orders" invented-rating line flagged
in every prior run is gone. Commit 74c5397 (2026-09-07, outside this
routine) replaced it with "Blended fresh on order & delivered in 30-45 mins"
in both [index.html:69](../index.html:69) and [ne/index.html:69](../ne/index.html:69).
That flag is now closed.

New finding, not fixed by this run (outside the evidence-gated metadata lane
this routine is authorized to act in — flagging for the owner rather than
auto-editing brand-voice copy): that replacement text actually uses an en
dash character in the live file ("30" + U+2013 + "45 mins"), in both the
English and Nepali versions, which violates the standing "no hyphen, en
dash, or em dash in visitor-facing copy" rule. `node check.js` does not
catch this (0 failures on this run), so it is not otherwise enforced today.
Worse, the Nepali line was hand-edited directly into `ne/index.html` and was
never added to `ne-copy.js`'s `strings`/`requiredIn` tables — checked
directly, no entry for this string exists anywhere in `ne-copy.js`. Since
`ne/index.html` is fully regenerated from `index.html` + `ne-copy.js` on
every `node build.js` run, the next build will silently drop the Nepali
translation on this line and ship the English text into `/ne/` instead,
with no build error, because the string is in neither `strings`
(translation pairs) nor `requiredIn` (the guard meant to catch exactly this
kind of drift). Recommend: replace the en dash with "30 to 45" (matches
phrasing used elsewhere on the site, e.g. `ne-copy.js:35`) in both language
versions, and add the pair to `ne-copy.js` so future builds keep
translating it.

Standing flags, still open: allergen lines on all 15 products in
`assets/js/products.js` remain UNVERIFIED against the real kitchen, still
the top outstanding risk until the owner confirms them. Also noted but not
touched: `sitemap.xml` has an uncommitted local diff (lastmod bumped from
2026-09-03 to 2026-09-08 on several URLs) that predates this run and was not
made by it; left as-is since nothing was deployed today.
