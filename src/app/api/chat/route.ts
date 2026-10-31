import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat";
import { loadNotices } from "@/lib/notices";

/** Mock chat endpoint. Answers come from the notices already on the site; no model or API key. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : "";
  if (!message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  return NextResponse.json(answerQuestion(message, loadNotices()));
}
