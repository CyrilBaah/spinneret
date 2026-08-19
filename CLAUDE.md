# Spinneret

Winning entry for Into the Scrape-Verse. One product: a schema-stable procurement feed. When the source page moves, we heal the collector in place. Same `c_*`. The dashboard never blanks.

## Bright Data

- CLI only via `npx -p @brightdata/cli`.
- Login: `bdata login --device` or `bdata login --api-key "$BRIGHTDATA_API_KEY"`.
- Never recreate a collector. Never print tokens. Never commit `.env`.
- Government domains are blocked (`Domain not allowed`). Do not target `.gov` / GHANEPS / PPA.

Pinned. Do not create another collector.

```
COLLECTOR_NOTICES = c_mszb8vqn27d8djbjon
```

Dashboard: https://brightdata.com/cp/scrapers/c_mszb8vqn27d8djbjon  
Source: https://procurement-notices.undp.org/  
Status: `done`. First run: **622 rows**. Fields now: `title`, `deadline`, `product_page_url`.

Loop closed on `c_mszb8vqn27d8djbjon`:
create → run (622) → heal → approve (CLI 500, schema saved in Studio) → re-run (621 rows, 7 fields).
Do not create. Do not heal. Do not run again unless the human asks.

Fields: title, deadline, product_page_url, ref_no, office_country, process, posted_at.

## The only product source

https://procurement-notices.undp.org/

Public listing. Not government. Not in the pre-built library. Create as Discovery, two fields first (`title`, `deadline`), then heal the same ID to add `ref_no`, `office_country`, `process`, `posted_at`, `source_url`.

If UNDP is also domain-blocked, one fallback: https://www.ungm.org/Public/Notice

Then stop. Do not add a third source this week.

## Do not extract

Staff names, emails, phones. Login-walled bid documents.

## Commands

```bash
npx -p @brightdata/cli bdata scraper create <URL> "<fields>"
npx -p @brightdata/cli bdata scraper run <ID> <URL> --pretty
npx -p @brightdata/cli bdata scraper heal <ID> "<what broke>" --url <URL>
npx -p @brightdata/cli bdata scraper approve <ID> --url <URL>
```

Create 5–15 min. One at a time. `awaiting_approval` is success. Approve only if preview matches `src/lib/schema.ts`. Unhealthy snapshots are not promoted.

Production runs: `POST https://api.brightdata.com/dca/trigger?collector=$ID&queue_next=1` then poll `GET /dca/dataset?id=j_*`.
