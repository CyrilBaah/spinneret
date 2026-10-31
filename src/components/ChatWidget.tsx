"use client";

import { useEffect, useRef, useState } from "react";
import { WELCOME, type ChatReply } from "@/lib/chat";

type Msg = { role: "user" | "bot"; reply: ChatReply };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", reply: WELCOME }]);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", reply: { text: message } }]);
    setBusy(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }),
        new Promise((r) => setTimeout(r, 450)), // let the typing dots show
      ]);
      const reply: ChatReply = res.ok
        ? await res.json()
        : { text: "Something went wrong reading the feed. Try again." };
      setMsgs((m) => [...m, { role: "bot", reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", reply: { text: "I can't reach the feed right now." } }]);
    } finally {
      setBusy(false);
    }
  }

  const last = msgs[msgs.length - 1];

  return (
    <div className="chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Spinneret assistant">
          <header className="chat-head">
            <div>
              <strong>Ask Spinneret</strong>
              <span>Demo assistant · mock answers from the feed</span>
            </div>
            <button className="chat-x" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>
          <div className="chat-log" ref={log} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <p>{m.reply.text}</p>
                {m.reply.cards?.map((c) => (
                  <a key={c.id} className="chat-card" href={`/notice/${c.id}`}>
                    <strong>{c.title}</strong>
                    <span>
                      {[c.process, c.country].filter(Boolean).join(" · ")}
                      {c.process || c.country ? " · " : ""}closes {c.deadline}
                    </span>
                  </a>
                ))}
              </div>
            ))}
            {busy && (
              <div className="chat-msg bot typing" aria-label="Assistant is typing">
                <i /><i /><i />
              </div>
            )}
          </div>
          {last.role === "bot" && last.reply.suggestions && !busy && (
            <div className="chat-chips">
              {last.reply.suggestions.map((s) => (
                <button key={s} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about notices…"
              maxLength={500}
              aria-label="Your question"
            />
            <button type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? "×" : "Ask"}
      </button>
    </div>
  );
}
