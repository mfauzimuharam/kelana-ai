"use client";

import { useState } from "react";

import ErrorMessage from "@/components/ErrorMessage";
import Markdown from "@/components/Markdown";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/services/api";
import { askAssistant } from "@/services/assistantService";
import type { AnswerResponse } from "@/types";

const SAMPLE_QUESTIONS = [
  "Do Indonesian passport holders need a visa to visit Japan?",
  "Can I bring medication into Japan?",
  "What baggage allowance do Standard packages include?",
  "Do I need a visa for Singapore?",
  "What should I pack for a winter trip?",
];

function Assistant() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<AnswerResponse[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    setLastQuestion(trimmed);
    try {
      const answer = await askAssistant(trimmed);
      setHistory((items) => [answer, ...items]);
      setQuestion("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Jalan-Jalan AI Travel Assistant</h1>
      <p className="text-slate-500">Ask factual travel questions — answers are grounded in trusted travel documents.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Can I bring medication into Japan?"
          disabled={busy}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
        />
        <button type="submit" disabled={busy || !question.trim()}
          className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {busy ? "Asking..." : "Ask ➤"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLE_QUESTIONS.map((sample) => (
          <button key={sample} type="button" disabled={busy} onClick={() => void ask(sample)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:border-teal-300 hover:text-teal-700 disabled:opacity-50">
            {sample}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {busy && (
          <div className="rounded-2xl bg-teal-50 p-8">
            <Spinner label="Searching the knowledge base and generating a grounded answer..." />
          </div>
        )}
        {error && <ErrorMessage title="Unable to get an answer" message={error} onRetry={() => void ask(lastQuestion)} />}

        {history.map((item, index) => (
          <article key={`${item.question}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Q: {item.question}</p>
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold tracking-wide text-teal-700 uppercase">AI answer</p>
              <Markdown>{item.answer}</Markdown>
            </div>
            {item.sources.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Sources {item.mode === "knowledge_base" ? "· Amazon Bedrock Knowledge Base" : "· Jalan-Jalan AI knowledge library"}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {item.sources.map((source) => (
                    <li key={source.name} title={source.excerpt ?? undefined}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700">
                      📄 {source.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}

        {!busy && history.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
            Try one of the sample questions above to see a grounded answer with its source documents.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <RequireAuth>
      <Assistant />
    </RequireAuth>
  );
}
