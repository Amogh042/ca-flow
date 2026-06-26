import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  FileText,
  Loader2,
  Send,
  Sparkles,

} from "lucide-react";
import { cn } from "@/lib/utils";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are CalcAI, the finance copilot inside CA-flow.

Behave like a senior tax, compliance, audit, payroll, and FP&A advisor for a finance firm.

Rules:
- Answer in structured markdown with short sections.
- Use bullets where useful.
- If tables help, keep them simple and readable.
- Be practical and operational, not generic.
- Call out assumptions and blockers.
- When relevant, mention statutory references or filing names.
- Never give investment advice or legal claims beyond factual guidance.`;

const examplePrompts = [
  "Prepare a monthly compliance review note",
  "Explain the difference between CGST, SGST, and IGST",
  "Draft a blocker summary for a missing bank ledger before TDS filing",
  "Give me an audit checklist for inventory valuation",
];

type Message = { role: "user" | "ai"; text: string; error?: boolean };

async function askGemini(question: string, history: Message[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "paste_your_key_here") {
    return [
      "## CalcAI is not configured yet",
      "",
      "- Add `VITE_GEMINI_API_KEY` to `.env`.",
      "- After that, this panel can generate finance answers, review notes, and client-ready summaries.",
      "",
      "### What you can ask",
      "- Tax computation and compliance queries",
      "- Review notes and audit checklists",
      "- Filing explanations and blocker summaries",
      "- Client-ready advisory notes",
    ].join("\n");
  }

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood." }] },
    ...history.slice(-8).map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.text }],
    })),
    { role: "user", parts: [{ text: question }] },
  ];

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.25, maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response received.";
}

function renderMarkdownLike(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (!bulletBuffer.length) return;
    elements.push(
      <ul key={`bullets-${elements.length}`} className="list-disc space-y-1 pl-5 text-sm text-[var(--text-primary)]">
        {bulletBuffer.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      bulletBuffer.push(line.slice(2).replace(/\*\*/g, ""));
      return;
    }

    flushBullets();

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${index}`} className="text-sm font-semibold uppercase tracking-wide text-primary">
          {line.slice(4).replace(/\*\*/g, "")}
        </h4>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${index}`} className="text-base font-semibold text-[var(--text-primary)]">
          {line.slice(3).replace(/\*\*/g, "")}
        </h3>,
      );
      return;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean)
        .filter((cell) => !/^:?-{2,}:?$/.test(cell));

      if (cells.length) {
        elements.push(
          <div key={`table-row-${index}`} className="grid gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 sm:grid-cols-2">
            {cells.map((cell, cellIndex) => (
              <div key={`${cell}-${cellIndex}`} className="text-sm text-[var(--text-primary)]">
                {cell.replace(/\*\*/g, "")}
              </div>
            ))}
          </div>,
        );
      }
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="text-sm leading-6 text-[var(--text-primary)]">
        {line.replace(/\*\*/g, "")}
      </p>,
    );
  });

  flushBullets();

  return <div className="space-y-3">{elements}</div>;
}

export default function CalcAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMessage: Message = { role: "user", text };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const reply = await askGemini(text, [...messages, userMessage]);
      setMessages((previous) => [...previous, { role: "ai", text: reply }]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessages((previous) => [
        ...previous,
        { role: "ai", text: `## Error\n\n- ${message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-60px-2rem-3.5rem)] md:h-[calc(100vh-60px-4rem)] -mx-4 md:-mx-8 -my-6 md:-my-8 flex">
      <aside className="hidden lg:flex flex-col w-[300px] shrink-0 border-r border-white/[0.06] p-4 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-xl bg-gradient-orange grid place-items-center glow-orange">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)]">CalcAI</div>
            <div className="text-xs text-secondary">Finance copilot for workspaces</div>
          </div>
        </div>

        <div className="mt-0">
          <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold text-secondary">
            Suggested starts
          </div>
          <div className="space-y-2">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left text-sm text-secondary hover:text-[var(--text-primary)] hover:border-primary/30 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-10">
              <div className="h-20 w-20 rounded-3xl bg-gradient-orange grid place-items-center glow-orange-strong mb-6">
                <Bot className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Ask CalcAI anything
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-secondary">
                Get structured answers for tax, compliance, audit, and advisory questions.
                Generate review notes, checklists, and client-ready summaries.
              </p>

              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="card-surface p-4 text-left text-sm flex items-start gap-3 hover:border-primary/40 transition-all"
                  >
                    <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-[var(--text-primary)]">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
                  {message.role === "ai" && (
                    <div className="h-9 w-9 rounded-xl bg-gradient-orange grid place-items-center shrink-0 mt-0.5">
                      {message.error ? (
                        <AlertCircle className="h-4 w-4 text-white" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-white" />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-4",
                      message.role === "user"
                        ? "bg-gradient-orange text-white rounded-tr-sm"
                        : message.error
                          ? "card-surface rounded-tl-sm border border-red-500/30"
                          : "card-surface rounded-tl-sm",
                    )}
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap text-sm leading-6">{message.text}</div>
                    ) : (
                      renderMarkdownLike(message.text)
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-9 w-9 rounded-xl bg-gradient-orange grid place-items-center shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="card-surface rounded-tl-sm px-4 py-3 rounded-2xl flex items-center gap-2 text-[var(--text-tertiary)]">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">Preparing structured answer...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-4" style={{ background: "var(--bg-surface)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask CalcAI for a note, checklist, summary, blocker analysis, or filing explanation..."
                rows={1}
                className="glass-input w-full py-3 pl-4 pr-14 text-sm resize-none overflow-hidden"
                style={{ minHeight: "52px", maxHeight: "140px" }}
                onInput={(event) => {
                  const target = event.currentTarget;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 140)}px`;
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-gradient-orange grid place-items-center glow-orange hover:glow-orange-strong transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-tertiary">
              <span>Shift + Enter for a new line</span>
              <span>{input.length} / 2000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
