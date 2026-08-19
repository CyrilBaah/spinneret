# Spinneret

Public procurement sites redesign. Scrapers go silent. People miss contracts.

Spinneret is a self-healing radar over **UNDP procurement notices**. Bright Data Scraper Studio owns the extractor. When the page moves, we heal the **same** Collector ID. **Nothing downstream sees a gap.**

Built for [Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse) (WeMakeDevs × Bright Data), 17–23 August 2026.

**Demo video:** [demo/spinneret-demo.mp4](demo/spinneret-demo.mp4)

## Collector proof

| | |
|---|---|
| Collector ID | `c_mszb8vqn27d8djbjon` |
| Source | https://procurement-notices.undp.org/ |
| Type | Discovery |
| First run | 622 rows (`title`, `deadline`, `product_page_url`) |
| After heal | 621 rows + `ref_no`, `office_country`, `process`, `posted_at` |
| API | `GET /dca/dataset?id=j_mszxp5ed9h5wao59t` → HTTP 200, 622 rows |
| Dashboard | https://brightdata.com/cp/scrapers/c_mszb8vqn27d8djbjon |

Sample output: [collectors/samples/notices.json](collectors/samples/notices.json)

## How Scraper Studio was used

1. **Create** from a coding agent: `bdata scraper create` on the UNDP listing (`title`, `deadline` only).
2. **Run:** 622 structured rows. Same `c_*`.
3. **Heal:** extend the schema in place (`ref_no`, `office_country`, `process`, `posted_at`). Preview approved.
4. **Commit:** CLI `approve` returned Bright Data `500 sprintf %j`. Schema saved in Studio on the same collector. Re-run: 621 rows, seven fields, **ID unchanged**.
5. **API:** `GET /dca/dataset` on an existing snapshot (no extra scrape). `POST /dca/trigger` is wired in `src/lib/bright.ts` and is opt-in (each live run is ~600 page-loads).

GHANEPS (`ghaneps.gov.gh`) was the first target. Bright Data returns `Domain not allowed` on government-classified sites. UNDP is a public IO listing, not in the pre-built library.

No hand-written CSS selectors. Scraper Studio owns the extractor. Downstream only sees the Zod contract.

## Run the console

```bash
cp .env.example .env.local   # optional: BRIGHTDATA_API_KEY
npm install
npm run dev
```

Open http://localhost:3000

- **Feed** — search / filter notices
- Click a title — source citation, no personal contacts
- **Break the page** — fill-rate drops, last-known-good stays
- **Heal in place** — same collector, badge goes green
- **Silk** — contract, collector ID, heal log

## Ethics

Public notices only. No login walls. No personal names or emails.

## License

Built for the hackathon. Use and fork freely.
