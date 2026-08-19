import { NextResponse } from "next/server";
import { SEED_HEALS, SEED_NOTICES } from "@/lib/seed";
import { scoreHealth } from "@/lib/schema";
import { collectorId } from "@/lib/bright";

export const dynamic = "force-dynamic";

export function GET() {
  const health = scoreHealth(SEED_NOTICES, SEED_NOTICES.length);
  return NextResponse.json({
    source: "https://procurement-notices.undp.org/",
    collector_id: collectorId(),
    captured_at: "2026-08-18",
    notices: SEED_NOTICES,
    health,
    heals: SEED_HEALS,
  });
}
