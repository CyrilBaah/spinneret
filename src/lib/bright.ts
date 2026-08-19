const API = "https://api.brightdata.com";

export const PINNED_COLLECTOR = "c_mszb8vqn27d8djbjon";
export const SOURCE_URL = "https://procurement-notices.undp.org/";
/** Pre-heal snapshot that already exists. Safe to GET. Do not treat as the healed schema. */
export const KNOWN_SNAPSHOT = "j_mszxp5ed9h5wao59t";
export const HEALED_SNAPSHOT = "j_mszytwnnuwg896vl5";

export function collectorId(): string {
  const id = process.env.COLLECTOR_NOTICES || PINNED_COLLECTOR;
  return id;
}

function token(): string {
  const value = process.env.BRIGHTDATA_API_KEY;
  if (!value) throw new Error("BRIGHTDATA_API_KEY is not set");
  return value;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
  };
}

export async function fetchSnapshot(snapshotId: string): Promise<unknown> {
  const res = await fetch(`${API}/dca/dataset?id=${snapshotId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`dataset ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Fires the collector as a production API. Costs one page-load per UNDP page (~600). */
export async function triggerCollection(url = SOURCE_URL): Promise<string> {
  const collector = collectorId();
  const res = await fetch(
    `${API}/dca/trigger?collector=${collector}&queue_next=1`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify([{ url }]),
    },
  );
  if (!res.ok) throw new Error(`trigger ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { collection_id?: string };
  if (!body.collection_id) throw new Error("trigger returned no collection_id");
  return body.collection_id;
}

export async function triggerAndFetch(url = SOURCE_URL): Promise<unknown> {
  const snapshotId = await triggerCollection(url);
  for (let i = 0; i < 48; i += 1) {
    const body = await fetchSnapshot(snapshotId);
    if (Array.isArray(body) && body.length > 0) return body;
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("snapshot still building");
}
