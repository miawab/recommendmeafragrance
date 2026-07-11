# recommendmeafragrance

A fragrance discovery app built around minigames and a token-limited AI chat. Every path ends
in a result card with a CJ affiliate buy link. Games are pure algorithms, zero AI cost. The only
AI surface is the Concierge chat, metered per user per day.

## Stack

Next.js 14 (App Router, TypeScript), Tailwind CSS, Upstash Redis (chat token metering + synced
offers), Groq (`llama-3.3-70b-versatile`) for chat, static JSON catalogs in `/public/data`.

## Local setup

```bash
cp .env.example .env.local   # fill in values, see below
pnpm install
pnpm dev
```

The app runs and every game works with zero env vars set (data pipeline output is already
committed to `/public/data`). Without `GROQ_API_KEY`, `/chat` shows a friendly "offline" message
instead of crashing. Without Upstash credentials, chat token counters and rate limiting fall back
to an in-memory store that's fine for local dev but resets on every restart and isn't shared
across serverless instances, do not rely on it in production.

### Environment variables

See `.env.example`. `DAILY_TOKEN_BUDGET` defaults to 8000 if unset. `CJ_SID_PREFIX` is prepended
to the per-surface SubID on every buy link.

## Data pipeline

```bash
cd data-pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install pandas unidecode
python build_catalog.py
```

Reads `./data-pipeline/raw/fra_cleaned.csv` (Kaggle "Fragrantica.com fragrance dataset", place it
there yourself, check its license tab for commercial use), writes `catalog-core.json` (famous
tier, ~300 entries, eager-loaded), `catalog-full.json` (all ~2500 entries, lazy-loaded), and
`notes.json` (canonical note vocabulary) to `/public/data`.

- `include_famous.txt`: hand-maintained hype list (`Brand | Name` per line), fuzzy-matched into
  the famous tier regardless of review-count rank. Add new releases here and rerun the pipeline.
- `unmatched_include.txt`: lines from `include_famous.txt` that didn't fuzzy-match anything in the
  raw dataset, written on every run.
- Brand → price tier / brand-group mapping is hand-tuned in `BRAND_META` in `build_catalog.py`.
  Unknown brands default to mid-tier/designer.
- Python tests: `python -m unittest test_build_catalog.py -v`

## CJ affiliate offers

Real CJ feed URLs go in `CJ_FEED_URLS` (comma-separated). Until you have them approved:

```bash
pnpm offers:stub          # placeholder Google-search links for every famous-tier item
pnpm offers:match         # test the matcher against data-pipeline/sample_feed.csv
```

`data-pipeline/match_offers.ts` is also the engine behind `/api/cron/feed-sync`, which Vercel
Cron hits daily (see `vercel.json`, protected by `Authorization: Bearer $CRON_SECRET`).

**Storage decision:** Vercel serverless functions have an ephemeral filesystem, the cron can't
write back to `/public/data/offers.json` at runtime. Rather than adding a second storage product
(e.g. Vercel Blob) for one JSON blob, the cron persists the synced offers map to the Upstash Redis
instance already used for chat token metering, under the key `offers:data`. The client fetches
`/api/offers`, which reads that key first and falls back to the static build-time
`offers.json` seed when Redis has nothing yet (fresh deploy, or Upstash not configured). This
means offers update without a redeploy, and the app still works with zero setup.

After a real sync, review `data-pipeline/unmatched_offers.txt` and add manual overrides to
`data-pipeline/offer_overrides.json` (keyed by perfume id, merged in last).

## Games

Scentle, Note Detective (`/api/guess`, server-computed daily answer, never shipped to the
client), Build-a-Bottle, Higher or Lower, Scent Roulette, Blind Buy Simulator. See `SETUP.md` for
full game rules.

## Tests

```bash
pnpm test                                    # vitest: seeded daily RNG, Scentle feedback,
                                              # Jaccard matcher, feed matcher, chat state
                                              # machine, recommendation JSON parsing
cd data-pipeline && python -m unittest test_build_catalog.py -v   # note normalizer
```

## Deploy

Push to GitHub, import to Vercel, add all `.env.example` vars in project settings, confirm the
`feed-sync` cron is registered from `vercel.json` with a matching `CRON_SECRET`.
