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

**2026-09-09** — No metadata change (still no valid performance export;
`seo/data/gsc_latest.json` is unchanged from yesterday, still 0
impressions/0 clicks site-wide via the Composio GSC connector, wrong shape
for the per-page gate regardless). `node check.js`: 49 pages, 0 failures,
0 warnings. Live probe of `/`, `/shop.html`, `/cart.html`, `/ne/`,
`/ne/shop.html`, `/product/acai-bowl.html`, `/sitemap.xml`, `/robots.txt`
all 200. Canonical on `/` resolves 200 direct, not a redirect. `www` still
308s to apex, direction unchanged. Schema still 3 JSON-LD blocks
(LocalBusiness/FoodEstablishment, WebSite, FAQPage), no aggregateRating.
Live `areaServed` still lists Kathmandu city plus the 12 named Place
entries matching all 12 SHOP.zones neighbourhoods exactly.

Fixed the en dash flagged 2026-09-08: [index.html:69](../index.html:69) read
"delivered in 30–45 mins" (U+2013), which violates the standing no
hyphen/en dash/em dash rule, and its Nepali twin in `ne/index.html:69` was
never added to `ne-copy.js`, so the next `node build.js` would have
silently overwritten the hand-edited Nepali line with untranslated English.
Changed the English source to "30 to 45 mins" and added the pair to
`ne-copy.js`'s `strings` table (matching the "देखि" phrasing already used
elsewhere, e.g. the cart page's "३० देखि ४५ मिनेट"). Ran `node build.js`
then `node check.js` (0 failures) to regenerate `ne/index.html` from the
table instead of the stale hand-edit, confirmed both language versions now
read "30 to 45" with no dash. This is a copy-compliance fix under the
playbook's non-negotiable organic rules, not a metadata edit, so it is not
gated by the impressions/CTR evidence rule and needed no review-date row.
Deployed (see commit for hash); asset-version hash and `sitemap.xml`
lastmod stamps moved on every page as a normal side effect of running
`node build.js` — not separate content changes.

Standing flags, still open: allergen lines on all 15 products in
`assets/js/products.js` remain UNVERIFIED against the real kitchen, still
the top outstanding risk until the owner confirms them.

**2026-09-10** — No metadata change (no valid performance export;
`seo/data/gsc_latest.json` unchanged since 2026-09-07, still 0
impressions/0 clicks site-wide via the Composio GSC connector, wrong shape
for the per-page 200-impression/CTR gate regardless). `node check.js`: 49
pages, 0 failures, 0 warnings. Live probe of `/`, `/shop.html`,
`/cart.html`, `/ne/`, `/ne/shop.html`, `/product/acai-bowl.html`,
`/sitemap.xml`, `/robots.txt` all 200. Canonical on `/` resolves 200
direct, not a redirect. `www` still 308s to apex, direction unchanged.
Schema still 3 JSON-LD blocks (FoodEstablishment/LocalBusiness, WebSite,
FAQPage), no aggregateRating. Live `areaServed` still lists Kathmandu city
plus the 12 named Place entries matching all 12 SHOP.zones neighbourhoods
exactly (Thamel, Durbar Marg, Lazimpat, Naxal, Baluwatar, Maharajgunj,
Chabahil, Baneshwor, Kalanki, Swayambhu, Gongabu, Koteshwor). Confirmed the
2026-09-09 en dash fix is live and holding: both English ("30 to 45 mins")
and Nepali ("३० देखि ४५ मिनेटमा") hero trust badge text read clean, no
dash characters. No invented rating text found on the live homepage.

Standing flags, still open: allergen lines on all 15 products in
`assets/js/products.js` remain UNVERIFIED against the real kitchen, still
the top outstanding risk until the owner confirms them. Also noted but not
touched: `sitemap.xml` has an uncommitted local diff (lastmod bumped from
2026-09-09 to 2026-09-10 on several URLs), present at session start before
this run made any changes; left as-is since nothing else was deployed
today and no code change was made.

**2026-09-15** — No metadata change (no valid performance export;
`seo/data/gsc_latest.json` is unchanged since 2026-09-07 — 8 days stale
and still the wrong shape for the per-page 200-impression/CTR gate
regardless; no CSV export has ever landed in `seo/data/`). `node check.js`:
49 pages, 0 failures, 0 warnings. Live probe of `/`, `/shop.html`,
`/cart.html`, `/ne/`, `/ne/shop.html`, `/product/acai-bowl.html`,
`/sitemap.xml`, `/robots.txt` all 200. Canonical on `/` is
`https://blendmandu.com/`, resolves 200 direct, not a redirect. `www`
still 308s to apex, direction unchanged. Schema still 3 JSON-LD blocks
(FoodEstablishment/LocalBusiness, WebSite, FAQPage), no aggregateRating
or reviewCount anywhere in the parsed blocks. Live `areaServed` still
lists Kathmandu city plus 12 named Place entries matching all 12
SHOP.zones neighbourhoods in `assets/js/products.js` exactly (Thamel,
Durbar Marg, Lazimpat, Naxal, Baluwatar, Maharajgunj, Chabahil, Baneshwor,
Kalanki, Swayambhu, Gongabu, Koteshwor). No invented rating text
("4.8", "200+ orders" or similar) found anywhere on the live homepage.

Housekeeping: this run found the 2026-09-10 entry above staged in git but
never committed, and no daily log entries at all for 2026-09-11 through
2026-09-14 — the routine appears to have not run (or not completed) for
four days before today. Committing the backlogged 2026-09-10 entry
together with today's in this run's commit; no health-check content was
lost since checks that were skipped don't retroactively exist to log. The
owner should check why the scheduled task did not fire 09-11 to 09-14.

Standing flags, still open: allergen lines on all 15 products in
`assets/js/products.js` remain UNVERIFIED against the real kitchen, still
the top outstanding risk until the owner confirms them. Also noted but
not touched: `sitemap.xml` has an uncommitted local diff (lastmod bumped
from 2026-09-09 to 2026-09-14 on several URLs), present at session start
before this run made any changes and predating this run; left as-is since
nothing else was deployed today and no code change was made.
