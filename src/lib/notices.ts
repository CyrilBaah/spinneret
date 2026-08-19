import raw from "../../collectors/samples/notices.json";
import { SEED_NOTICES, type HealEvent } from "./seed";
import type { Notice } from "./schema";

type RawRow = {
  title?: string;
  deadline?: string;
  product_page_url?: string;
  source_url?: string;
  ref_no?: string;
  office_country?: string;
  process?: string;
  posted_at?: string;
};

function idFrom(url?: string): string {
  if (!url) return Math.random().toString(36).slice(2);
  const match = url.match(/nego_id=(\d+)/);
  return match?.[1] ?? url;
}

export function mapRow(row: RawRow): Notice {
  const source = row.product_page_url || row.source_url;
  return {
    id: idFrom(source),
    title: row.title ?? "",
    deadline: row.deadline ?? "",
    ref_no: row.ref_no,
    office_country: row.office_country,
    process: row.process,
    posted_at: row.posted_at,
    source_url: source,
  };
}

export function loadNotices(): Notice[] {
  const rows = (raw as RawRow[]).map(mapRow).filter((n) => n.title.length >= 8);
  return rows.length >= 5 ? rows : SEED_NOTICES;
}

export type { HealEvent };
