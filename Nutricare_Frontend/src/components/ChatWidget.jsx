import { useEffect, useRef, useState } from "react";
import { http, getApiErrorMessage } from "../shared/api/http";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const endRef = useRef(null);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, history]);

  const send = async () => {
    const text = message.trim();
    if (!text) return;
    setError("");
    setSending(true);

    const nextHistory = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setMessage("");

    try {
      const res = await http.post("/ai/chat", {
        message: text,
        history: nextHistory.slice(-10),
      });
      const reply = res?.data?.reply || "No reply.";
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open ? (
        <div className="w-[340px] max-w-[calc(100vw-48px)] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div>
              <div className="text-sm font-semibold">NutriCare Coach</div>
              <div className="text-[11px] text-white/70">
                Diet & fitness guidance
              </div>
            </div>
            <button
              className="rounded-xl bg-white/10 px-3 py-1 text-sm"
              onClick={() => setOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="h-[360px] overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {history.length === 0 ? (
              <div className="text-sm text-slate-600">
                Ask anything about diet plans, calories, protein, weight loss, or
                muscle gain.
              </div>
            ) : (
              history.map((m, idx) => (
                <div
                  key={idx}
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto bg-emerald-600 text-white"
                      : "bg-white border border-slate-200 text-slate-800",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="px-4 py-3 bg-white border-t border-slate-200">
            {error ? (
              <div className="mb-2 text-xs text-red-600">{error}</div>
            ) : null}
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Type a message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending) send();
                  }
                }}
                disabled={sending}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={send}
                disabled={sending}
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl"
        >
          Chat
        </button>
      )}
    </div>
  );
}

