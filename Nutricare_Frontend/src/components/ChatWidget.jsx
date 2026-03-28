import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import { getChatHistory, sendChatMessage } from "../features/ai/aiApi";

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "bg-emerald-600 text-white"
            : "border border-slate-200 bg-white text-slate-700",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const endRef = useRef(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, history]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!open || history.length > 0) return;
      setLoadingHistory(true);
      try {
        const res = await getChatHistory();
        if (!active) return;
        setHistory(Array.isArray(res?.data) ? res.data : []);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [open, history.length]);

  const send = async () => {
    const text = message.trim();
    if (!text) return;

    setError("");
    setSending(true);

    const nextHistory = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setMessage("");

    try {
      const res = await sendChatMessage({
        message: text,
        history: nextHistory.slice(-10),
      });
      const reply =
        res?.data?.reply ||
        res?.reply ||
        "I can help with diet, food, activity, and wellness guidance.";
      setHistory((current) => [...current, { role: "assistant", content: reply }]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open ? (
        <div className="w-[370px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">NutriCare Coach</div>
              <div className="text-xs text-slate-500">
                Diet, food, activity, and wellness guidance
              </div>
            </div>
            <button
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
              onClick={() => setOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="h-[420px] space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {loadingHistory ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Loading chat history...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                Ask about healthy meals, calorie balance, protein intake, hydration,
                activity, or sustainable wellness habits.
              </div>
            ) : (
              history.map((item, index) => (
                <ChatBubble
                  key={`${item.role}-${index}`}
                  role={item.role}
                  content={item.content}
                />
              ))
            )}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  NutriCare Coach is typing...
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4">
            {error ? (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                className="input min-h-[52px] resize-none"
                placeholder="Ask about meals, calories, workouts, or healthy habits..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!sending) send();
                  }
                }}
                disabled={sending}
              />
              <button
                type="button"
                className="btn-primary shrink-0"
                onClick={send}
                disabled={sending || !message.trim()}
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
          className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-300/60 transition hover:bg-emerald-700"
        >
          Chat Assistant
        </button>
      )}
    </div>
  );
}
