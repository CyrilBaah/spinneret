"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HealEvent } from "@/lib/seed";
import type { Health, Notice } from "@/lib/schema";

type Props = {
  notices: Notice[];
  health: Health;
  collectorId: string | null;
  heals: HealEvent[];
};

export function Feed({ notices, health, collectorId, heals }: Props) {
  const [q, setQ] = useState("");
  const [process, setProcess] = useState("all");
  const [broken, setBroken] = useState(false);
  const [healed, setHealed] = useState(false);
  const [healing, setHealing] = useState(false);

  const processes = useMemo(
    () => Array.from(new Set(notices.map((n) => n.process).filter(Boolean))) as string[],
    [notices],
  );

  const visible = notices.filter((n) => {
    const hay = `${n.title} ${n.office_country} ${n.ref_no}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (process !== "all" && n.process !== process) return false;
    return true;
  });

  const displayHealth: Health = broken && !healed
    ? { ok: false, rows: notices.length, fill_rate: 0.41, reasons: ["title and deadline returned null after markup move"] }
    : health;

  function breakPage() {
    setBroken(true);
    setHealed(false);
  }

  function heal() {
    setHealing(true);
    window.setTimeout(() => {
      setHealed(true);
      setHealing(false);
    }, 1400);
  }

  return (
    <>
      <section className="hero">
        <h1>The feed that does not go silent.</h1>
        <p>
          UNDP procurement notices, held to a contract. When the page moves, Scraper Studio
          heals the collector in place. Same ID. Last-known-good stays on screen.
        </p>
      </section>

      <div className="stats">
        <div className="stat">
          <b>{notices.length}</b>
          <span>open notices</span>
        </div>
        <div className="stat">
          <b>{Math.round(displayHealth.fill_rate * 100)}%</b>
          <span>fill rate</span>
        </div>
        <div className="stat">
          <b>{collectorId ? collectorId.slice(0, 12) : "unpinned"}</b>
          <span>collector</span>
        </div>
        <div className="stat">
          <b>{heals.filter((h) => h.decision === "blocked").length}</b>
          <span>gov domains refused</span>
        </div>
      </div>

      <div className={`banner ${displayHealth.ok ? "" : "broke"}`}>
        {displayHealth.ok ? (
          <>
            <span className="badge live">healthy</span>{" "}
            Serving last-known-good from UNDP. Contract holds. Downstream sees this table.
          </>
        ) : (
          <>
            <span className="badge broke">extraction failed</span>{" "}
            Fill-rate {Math.round(displayHealth.fill_rate * 100)}%. {displayHealth.reasons[0]}.{" "}
            <strong>This table is yesterday’s good snapshot — the gap never shipped.</strong>
          </>
        )}
      </div>

      <div className="toolbar">
        <input
          placeholder="Search title, country, ref"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={process} onChange={(e) => setProcess(e.target.value)}>
          <option value="all">All processes</option>
          {processes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={breakPage} disabled={broken && !healed}>
            Break the page
          </button>
          <button className="btn" type="button" onClick={heal} disabled={!broken || healed || healing}>
            {healing ? "Healing…" : healed ? "Healed · same c_*" : "Heal in place"}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Notice</th>
              <th>Office</th>
              <th>Process</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link className="title-cell" href={`/notice/${n.id}`}>
                    {n.title}
                  </Link>
                  <div className="mono muted">{n.ref_no}</div>
                </td>
                <td>{n.office_country}</td>
                <td className="muted">{n.process?.split("—")[0]}</td>
                <td className="mono">{n.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
