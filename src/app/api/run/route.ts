import { NextResponse } from "next/server";
import {
  KNOWN_SNAPSHOT,
  fetchSnapshot,
  triggerCollection,
} from "@/lib/bright";
import { scoreHealth } from "@/lib/schema";

export const dynamic = "force-dynamic";

function asRows(body: unknown): Record<string, unknown>[] {
  return Array.isArray(body) ? (body as Record<string, unknown>[]) : [];
}

/** GET = pull an existing snapshot. No new scrape. */
export async function GET(request: Request) {
  if (!process.env.BRIGHTDATA_API_KEY) {
    return NextResponse.json({ ok: false, error: "BRIGHTDATA_API_KEY missing" }, { status: 409 });
  }
  const id = new URL(request.url).searchParams.get("id") || KNOWN_SNAPSHOT;
  try {
    const body = await fetchSnapshot(id);
    const rows = asRows(body);
    return NextResponse.json({
      ok: true,
      mode: "snapshot",
      snapshot_id: id,
      health: scoreHealth(rows),
      sample: rows[0] ?? null,
      rows: rows.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "snapshot failed" },
      { status: 502 },
    );
  }
}

/** POST ?live=1 = new scrape (~600 page-loads). POST without live is refused. */
export async function POST(request: Request) {
  if (!process.env.BRIGHTDATA_API_KEY) {
    return NextResponse.json({ ok: false, error: "BRIGHTDATA_API_KEY missing" }, { status: 409 });
  }
  const live = new URL(request.url).searchParams.get("live") === "1";
  if (!live) {
    return NextResponse.json(
      {
        ok: false,
        error: "Refusing a blind re-scrape. GET /api/run to pull the existing snapshot, or POST /api/run?live=1 to spend credits.",
      },
      { status: 400 },
    );
  }
  try {
    const snapshotId = await triggerCollection();
    return NextResponse.json({
      ok: true,
      mode: "triggered",
      snapshot_id: snapshotId,
      collector: process.env.COLLECTOR_NOTICES,
      poll: `/api/run?id=${snapshotId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "trigger failed" },
      { status: 502 },
    );
  }
}
