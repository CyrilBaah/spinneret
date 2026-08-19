import { collectorId } from "@/lib/bright";
import { loadNotices } from "@/lib/notices";
import { scoreHealth } from "@/lib/schema";
import { SEED_HEALS } from "@/lib/seed";

export default function SilkPage() {
  const notices = loadNotices();
  const health = scoreHealth(notices, notices.length);
  const id = collectorId();

  return (
    <>
      <section className="hero">
        <h1>Silk.</h1>
        <p>
          The collector is the thread. Heal rewrites the extractor. The ID never
          rotates. Unhealthy snapshots never reach this page.
        </p>
      </section>

      <div className="grid-2">
        <div className="card">
          <h2>Contract</h2>
          <p className="muted">
            LLM / Scraper Studio proposes. Zod decides. Fill-rate must stay ≥ 70%.
            Required fields: title, deadline. A 50% row collapse is an incident.
          </p>
          <dl className="dl">
            <dt>Rows</dt>
            <dd>{health.rows}</dd>
            <dt>Fill rate</dt>
            <dd>{Math.round(health.fill_rate * 100)}%</dd>
            <dt>Status</dt>
            <dd>
              <span className={`badge ${health.ok ? "live" : "broke"}`}>
                {health.ok ? "healthy" : "held"}
              </span>
            </dd>
            <dt>Collector</dt>
            <dd className="mono">{id}</dd>
            <dt>API</dt>
            <dd className="mono">GET /dca/dataset?id=j_mszxp5ed9h5wao59t → 200 · 622 rows</dd>
          </dl>
        </div>
        <div className="card">
          <h2>Heal log</h2>
          <ul className="timeline">
            {SEED_HEALS.map((event) => (
              <li key={event.id}>
                <div>
                  <span className={`badge ${event.decision === "blocked" ? "broke" : "live"}`}>
                    {event.decision}
                  </span>{" "}
                  <span className="mono muted">{event.at.slice(0, 10)}</span>
                </div>
                <div className="mono">{event.collector_id}</div>
                <div>{event.note}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
