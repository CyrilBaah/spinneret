import type { Notice } from "./schema";
import { PINNED_COLLECTOR, SOURCE_URL } from "./bright";
import { SEED_HEALS } from "./seed";

/** Mock assistant. No model, no key: intent rules over the notices already on the site. */

export type ChatCard = {
  id: string;
  title: string;
  deadline: string;
  country?: string;
  process?: string;
  url?: string;
};

export type ChatReply = {
  text: string;
  cards?: ChatCard[];
  suggestions?: string[];
};

export const WELCOME: ChatReply = {
  text:
    "I'm the Spinneret assistant. Ask me about the procurement notices on this site, " +
    "or how the feed heals itself when the source page changes.",
  suggestions: [
    "How many notices are there?",
    "What closes soonest?",
    "Show RFQs in Ukraine",
    "How does healing work?",
  ],
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PROCESS_WORDS: Record<string, string> = {
  rfp: "RFP",
  rfq: "RFQ",
  itb: "ITB",
  eoi: "EOI",
  ic: "IC",
};
const STOP = new Set(
  ("a an the of for in on to and or is are was were be me my show list find give tell about what " +
    "which who where when how any all some there with from notice notices tender tenders please " +
    "can you do does i we it this that have has").split(" "),
);

/** "26-Aug-26 @ 05:00 AM (New York time)" or "2026-09-01 06:00" -> epoch ms, or null. */
export function parseWhen(value?: string): number | null {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3], +(iso[4] ?? 0), +(iso[5] ?? 0));
  const m = value.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})(?:\s*@\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  let hour = m[4] ? +m[4] % 12 : 0;
  if (m[6]?.toUpperCase() === "PM") hour += 12;
  return Date.UTC(2000 + +m[3], month, +m[1], hour, m[5] ? +m[5] : 0);
}

/** "UNDP-PHL/PHILIPPINES" -> "Philippines" */
export function countryName(raw?: string): string | undefined {
  if (!raw) return undefined;
  const name = raw.includes("/") ? raw.split("/").pop()! : raw;
  const clean = name.trim().toLowerCase();
  if (!clean) return undefined;
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

function processCode(raw?: string): string | undefined {
  return raw?.split(/\s+[-—–]\s+/)[0]?.trim().toUpperCase() || undefined;
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)} ${d.getUTCFullYear()}`;
}

function toCard(n: Notice): ChatCard {
  return {
    id: n.id,
    title: n.title,
    deadline: n.deadline,
    country: countryName(n.office_country),
    process: processCode(n.process),
    url: n.source_url,
  };
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export function answerQuestion(question: string, notices: Notice[]): ChatReply {
  const q = question.trim().toLowerCase();
  if (!q) return WELCOME;

  const asOf = Math.max(0, ...notices.map((n) => parseWhen(n.posted_at) ?? 0)) || Date.now();
  const has = (...words: RegExp[]) => words.some((w) => w.test(q));

  // Guardrail from the project brief: no staff names, emails or phone numbers.
  if (has(/e-?mail/, /phone/, /\bcontact\b/, /\bstaff\b/, /who (is|are) (the )?(buyer|officer|focal)/)) {
    return {
      text:
        "Spinneret doesn't collect staff names, emails or phone numbers. Only public notice fields: " +
        "title, deadline, reference, office, process type, posted date and the source link. " +
        "Open the notice on the UNDP site for contact instructions.",
      suggestions: ["What fields do you collect?"],
    };
  }

  if (has(/^(hi|hello|hey|help)\b/, /what can you (do|answer)/)) return WELCOME;

  if (has(/\bfields?\b/, /\bcolumns?\b/, /\bschema\b/, /what (data|do you collect)/)) {
    return {
      text:
        "Seven fields per notice: title, deadline, product_page_url, ref_no, office_country, process and posted_at. " +
        "Title and deadline are required. The Zod schema rejects a snapshot if either goes missing.",
      suggestions: ["How does healing work?", "Is the feed healthy?"],
    };
  }

  if (has(/\bheal/, /\bbroke/, /\bsilk\b/, /self-?heal/, /\bapprove/, /redesign/)) {
    const approved = SEED_HEALS.find((h) => h.decision === "approved");
    return {
      text:
        "When the source page changes, the collector is healed in place. It keeps the same ID " +
        `(${PINNED_COLLECTOR}), so the dashboard never blanks. A health gate checks row count, fill rate ` +
        "and required fields before a snapshot is promoted, and an unhealthy one is held while the last good data stays up." +
        (approved ? ` Last heal: ${approved.note}` : ""),
      suggestions: ["Is the feed healthy?", "What fields do you collect?"],
    };
  }

  if (has(/\bcollector\b/, /\bbright ?data\b/, /\bsource\b/, /where.*(data|come)/, /\bapi\b/)) {
    return {
      text:
        `Data comes from a single Bright Data collector (${PINNED_COLLECTOR}) pointed at ${SOURCE_URL}, ` +
        "UNDP's public procurement notices. Government domains are blocked by Bright Data, so none are scraped.",
      suggestions: ["How does healing work?", "How many notices are there?"],
    };
  }

  if (has(/health/, /\bok\b/, /\bworking\b/, /\bstatus\b/, /fill.?rate/)) {
    const filled = notices.filter((n) => n.title && n.deadline).length;
    return {
      text:
        `The feed is healthy. ${plural(notices.length, "notice")} loaded, ` +
        `${Math.round((filled / Math.max(1, notices.length)) * 100)}% have both title and deadline ` +
        "(the gate needs 70%).",
      suggestions: ["How does healing work?", "What closes soonest?"],
    };
  }

  // Filters shared by the data questions below.
  const countries = [...new Set(notices.map((n) => countryName(n.office_country)).filter(Boolean))] as string[];
  const country = countries
    .sort((a, b) => b.length - a.length)
    .find((c) => new RegExp(`\\b${c.toLowerCase()}\\b`).test(q));
  const proc = Object.keys(PROCESS_WORDS).find((k) => new RegExp(`\\b${k}s?\\b`).test(q));
  const wantsIC = /individual contractor/.test(q);
  const processFilter = proc ? PROCESS_WORDS[proc] : wantsIC ? "IC" : undefined;

  let pool = notices;
  const scope: string[] = [];
  if (country) {
    pool = pool.filter((n) => countryName(n.office_country) === country);
    scope.push(`in ${country}`);
  }
  if (processFilter) {
    pool = pool.filter((n) => processCode(n.process) === processFilter);
    scope.push(`of type ${processFilter}`);
  }
  const scopeText = scope.length ? ` ${scope.join(" ")}` : "";

  if (has(/how many/, /\bcount\b/, /\btotal\b/, /number of/)) {
    if (!scope.length && has(/countr/)) {
      return { text: `Notices come from ${plural(countries.length, "country office")}.`, suggestions: ["Which country has the most?"] };
    }
    return {
      text: `There ${pool.length === 1 ? "is" : "are"} ${plural(pool.length, "notice")}${scopeText}.`,
      suggestions: scope.length ? ["What closes soonest?"] : ["Which country has the most?", "Show RFQs in Ukraine"],
    };
  }

  if (has(/most/, /top/, /busiest/) && has(/countr/, /office/)) {
    const tally = new Map<string, number>();
    for (const n of pool) {
      const c = countryName(n.office_country);
      if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
    }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      text: `Most active offices: ${top.map(([c, n]) => `${c} (${n})`).join(", ")}.`,
      suggestions: [`Show notices in ${top[0]?.[0] ?? "Ukraine"}`],
    };
  }

  if (has(/process/, /type/, /kind/) && !scope.length && has(/types?|kinds?|processes/)) {
    const tally = new Map<string, number>();
    for (const n of notices) {
      const p = processCode(n.process);
      if (p) tally.set(p, (tally.get(p) ?? 0) + 1);
    }
    const rows = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      text: `Process types: ${rows.map(([p, n]) => `${p} (${n})`).join(", ")}.`,
      suggestions: ["Show RFQs in Ukraine", "Show individual contractor roles"],
    };
  }

  const sortable = pool
    .map((n) => ({ n, due: parseWhen(n.deadline), posted: parseWhen(n.posted_at) }))
    .filter((x) => x.due !== null);

  if (has(/clos/, /soon/, /deadline/, /urgent/, /expir/, /due/, /next/)) {
    const open = sortable.filter((x) => x.due! >= asOf).sort((a, b) => a.due! - b.due!);
    const list = (open.length ? open : sortable.sort((a, b) => b.due! - a.due!)).slice(0, 4);
    if (!list.length) return { text: `No notices with a readable deadline${scopeText}.` };
    return {
      text: open.length
        ? `Closing soonest${scopeText} (as of the ${fmtDate(asOf)} snapshot):`
        : `Everything${scopeText} is past deadline as of the ${fmtDate(asOf)} snapshot. Most recent closes:`,
      cards: list.map((x) => toCard(x.n)),
      suggestions: ["What was posted most recently?"],
    };
  }

  if (has(/latest/, /newest/, /recent/, /new /, /posted/)) {
    const list = sortable.sort((a, b) => (b.posted ?? 0) - (a.posted ?? 0)).slice(0, 4);
    if (!list.length) return { text: `Nothing posted${scopeText} yet.` };
    return { text: `Most recently posted${scopeText}:`, cards: list.map((x) => toCard(x.n)), suggestions: ["What closes soonest?"] };
  }

  // Keyword search over title / reference, narrowed by any country or process filter.
  const words = tokens(q).filter((t) => t !== country?.toLowerCase() && !(proc && t.replace(/s$/, "") === proc));
  const scored = pool
    .map((n) => {
      const hay = `${n.title} ${n.ref_no ?? ""} ${n.description ?? ""}`.toLowerCase();
      return { n, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => (words.length ? x.score > 0 : scope.length > 0))
    .sort((a, b) => b.score - a.score);

  if (scored.length) {
    const shown = scored.slice(0, 4);
    return {
      text: `Found ${plural(scored.length, "notice")}${scopeText}${words.length ? ` matching "${words.join(" ")}"` : ""}. Top ${shown.length}:`,
      cards: shown.map((x) => toCard(x.n)),
      suggestions: ["What closes soonest?", "How does healing work?"],
    };
  }

  return {
    text:
      "I couldn't find that in the current feed. Try a topic (\"solar\", \"consultant\"), a country, " +
      "a process type like RFQ, or ask how the collector heals.",
    suggestions: WELCOME.suggestions,
  };
}
