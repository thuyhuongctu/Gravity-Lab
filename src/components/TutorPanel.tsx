import { useEffect, useRef, useState } from "react";
import { ArrowRight, GraduationCap, Send, X } from "lucide-react";
import type { Reply } from "@/sim/tutor";
import type { Entry, TutorPanel as Panel, TutorRoom } from "@/sim/tutor-kb";
import { tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

type Turn = { id: number; q: string; reply: Reply };

const STARTERS = ["ppml", "elasticity", "distance-puzzle", "upload"];

/** Header button and panel: an offline assistant that answers from the app's own sources. */
export function TutorPanel({ onOpen }: { onOpen: (room: TutorRoom, panel?: Panel) => void }) {
  usePrefs();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // The knowledge base loads on first open, so it adds nothing to the page's first load.
  const [engine, setEngine] = useState<typeof import("@/sim/tutor") | null>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    if (!engine) void import("@/sim/tutor").then(setEngine);
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, engine]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [turns]);

  function submit(q: string) {
    const query = q.trim();
    if (!query || !engine) return;
    setTurns((t) => [...t.slice(-9), { id: Date.now(), q: query, reply: engine.ask(query) }]);
    setText("");
  }

  const pick = (e: Entry) => setTurns((t) => [...t.slice(-9), { id: Date.now(), q: tr(e.q.vi, e.q.en), reply: { kind: "answer", entry: e, related: [] } }]);

  const chips = (entries: Entry[]) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {entries.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => pick(e)}
          className="noir-raise min-h-9 rounded-full px-3 py-1 text-left text-xs font-medium"
        >
          {tr(e.q.vi, e.q.en)}
        </button>
      ))}
    </div>
  );

  const starters = engine
    ? STARTERS.map((id) => engine.KB.find((e) => e.id === id)).filter((e): e is Entry => !!e)
    : [];

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={tr("Trợ giảng", "Teaching assistant")}
        className={
          "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full sm:min-h-11 sm:min-w-11 " +
          (open ? "bg-teal-2 text-void" : "noir-raise text-paper")
        }
      >
        <GraduationCap className="size-4" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={tr("Trợ giảng", "Teaching assistant")}
          className="surface noir-card fixed inset-x-3 top-16 z-50 flex max-h-[calc(100dvh-5rem)] flex-col rounded-[26px] text-ink sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-[26rem]"
        >
          <div className="flex items-start justify-between gap-3 p-4 pb-2">
            <img
              src={`${import.meta.env.BASE_URL}cast/v2/huong-face.webp`}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full bg-[#f1e8de] object-cover shadow-[0_0_0_2px_rgba(94,234,212,0.55),0_0_24px_rgba(94,234,212,0.3)]"
            />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg leading-tight">{tr("Lumina · Trợ giảng", "Lumina · Teaching assistant")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {tr(
                  "Trả lời từ tài liệu đã có trong app, kèm nguồn. Không dùng AI tạo sinh, không gửi câu hỏi đi đâu.",
                  "Answers from the sources already in the app, with citations. No generative AI; your questions stay on this device.",
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tr("Đóng", "Close")}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={list} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4">
            {turns.length === 0 ? (
              <div className="pb-2">
                <p className="text-sm">{tr("Bạn có thể hỏi, ví dụ:", "You could ask, for example:")}</p>
                {chips(starters)}
              </div>
            ) : null}
            {turns.map((t) => (
              <div key={t.id} className="mb-4">
                <p className="cosmic-btn ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-md px-3.5 py-2.5 text-sm">{t.q}</p>
                {t.reply.kind === "answer" ? (
                  <div className="noir-track mt-2 max-w-[95%] rounded-[20px] rounded-bl-md px-3.5 py-3">
                    <p className="text-xs font-medium text-teal">{tr(t.reply.entry.q.vi, t.reply.entry.q.en)}</p>
                    <p className="mt-1 text-sm leading-relaxed">{tr(t.reply.entry.a.vi, t.reply.entry.a.en)}</p>
                    {t.reply.entry.cite.length ? (
                      <p className="mt-2 text-xs text-muted">
                        {tr("Nguồn: ", "Sources: ")}
                        {t.reply.entry.cite.join("; ")}
                      </p>
                    ) : null}
                    {t.reply.entry.see ? (
                      <button
                        type="button"
                        onClick={() => {
                          const see = t.reply.kind === "answer" ? t.reply.entry.see : undefined;
                          if (!see) return;
                          onOpen(see.room, see.panel);
                          setOpen(false);
                        }}
                        className="amber-btn mt-2.5 inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 text-xs font-semibold"
                      >
                        {tr(t.reply.entry.see.vi, t.reply.entry.see.en)}
                        <ArrowRight className="size-3.5" />
                      </button>
                    ) : null}
                    {t.reply.related.length ? (
                      <>
                        <p className="mt-3 text-xs text-muted">{tr("Câu liên quan:", "Related:")}</p>
                        {chips(t.reply.related)}
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="noir-track mt-2 max-w-[95%] rounded-[20px] rounded-bl-md px-3.5 py-3">
                    <p className="text-sm leading-relaxed">
                      {tr(
                        "Mình chưa có tài liệu cho câu này trong app, nên không trả lời để tránh đoán sai. Thử hỏi về mô hình trọng lực, FDI vào Việt Nam, OLS và PPML, hoặc cách dùng các phòng.",
                        "There is no source for this in the app, so I won't guess. Try asking about the gravity model, FDI into Vietnam, OLS and PPML, or how to use the rooms.",
                      )}
                    </p>
                    {chips(starters)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(text);
            }}
          >
            <label htmlFor="tutor-q" className="sr-only">
              {tr("Câu hỏi của bạn", "Your question")}
            </label>
            <input
              ref={input}
              id="tutor-q"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder={tr("Hỏi về trọng lực, FDI, PPML…", "Ask about gravity, FDI, PPML…")}
              className="noir-track min-h-12 min-w-0 flex-1 rounded-full px-4 text-sm text-ink placeholder:text-muted"
            />
            <button
              type="submit"
              aria-label={tr("Gửi câu hỏi", "Send question")}
              className="cosmic-btn inline-flex size-12 shrink-0 items-center justify-center rounded-full"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
