# Daily SEO routine

## What runs every day (safe, no churn)

1. `node check.js` — canonicals, origin drift, hreflang pairs, broken links,
   mixed asset versions, noindex leaks, double-escaped entities.
2. Live probe of the real domain: key routes return 200, canonical resolves
   200 rather than a redirect, sitemap and robots reachable and on-origin.
3. Schema sanity: LocalBusiness parses, areaServed still matches SHOP.zones,
   no aggregateRating present unless real reviews exist.
4. Append findings to `seo/DECISIONS.md`. If nothing changed, say so and stop.

Health checks are safe to run daily because they change nothing.

## What does NOT run every day

Metadata edits. A title or description is only rewritten when there is
evidence to justify it:

- the page has **at least 200 impressions over 28 days** in Search Console,
  which is roughly the floor where CTR is not noise, and
- its CTR is below the position-adjusted benchmark, and
- **no metadata change to that page in the previous 28 days**.

One page, one change, one variable at a time. Anything else makes the result
unattributable, which is the same as having no data.

## Where the data comes from

There is no Search Console API connector available in this environment, so
performance data has to be exported by hand:

  Search Console -> Performance -> Export -> CSV
  drop it in `seo/data/YYYY-MM-DD-performance.csv`

The daily run reads the newest export it finds. With no export present it
runs the health checks only and records that the data is stale.

## Organic rules (non-negotiable)

- No invented review counts, ratings, or order volumes in copy or schema.
- No keyword stuffing. A title reads as a sentence a person would say.
- No doorway pages for neighbourhoods. One honest delivery-areas section,
  not twelve thin near-duplicate pages.
- No claim on the page that is not true of the kitchen. Allergens especially.
- Nepali copy is translated, never machine-dumped into `/ne/`.
