import { z } from "zod";

export const NoticeSchema = z.object({
  id: z.string(),
  title: z.string().min(8),
  deadline: z.string().min(4),
  ref_no: z.string().optional(),
  office_country: z.string().optional(),
  process: z.string().optional(),
  posted_at: z.string().optional(),
  source_url: z.string().url().optional(),
  description: z.string().optional(),
});

export type Notice = z.infer<typeof NoticeSchema>;

export const HealthRule = {
  min_rows: 5,
  min_fill_rate: 0.7,
  required: ["title", "deadline"] as const,
  max_row_drop_ratio: 0.5,
};

export type Health = {
  ok: boolean;
  rows: number;
  fill_rate: number;
  reasons: string[];
};

export function fillRate(rows: Record<string, unknown>[], fields: string[]): number {
  if (!rows.length || !fields.length) return 0;
  let filled = 0;
  let total = 0;
  for (const row of rows) {
    for (const field of fields) {
      total += 1;
      const value = row[field];
      if (value !== null && value !== undefined && String(value).trim() !== "") filled += 1;
    }
  }
  return filled / total;
}

export function scoreHealth(
  rows: Record<string, unknown>[],
  lastGoodCount?: number,
): Health {
  const reasons: string[] = [];
  if (rows.length < HealthRule.min_rows) {
    reasons.push(`row_count ${rows.length} < ${HealthRule.min_rows}`);
  }
  const rate = fillRate(rows, [...HealthRule.required]);
  if (rate < HealthRule.min_fill_rate) {
    reasons.push(`fill_rate ${rate.toFixed(2)} < ${HealthRule.min_fill_rate}`);
  }
  for (const field of HealthRule.required) {
    const missing = rows.filter((row) => !row[field] || String(row[field]).trim() === "").length;
    if (rows.length > 0 && missing === rows.length) {
      reasons.push(`${field} empty on every row`);
    }
  }
  if (
    typeof lastGoodCount === "number" &&
    lastGoodCount > 0 &&
    rows.length < lastGoodCount * (1 - HealthRule.max_row_drop_ratio)
  ) {
    reasons.push(`row_count dropped ${lastGoodCount} → ${rows.length}`);
  }
  return { ok: reasons.length === 0, rows: rows.length, fill_rate: rate, reasons };
}
