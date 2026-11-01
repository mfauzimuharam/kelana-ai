import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

const LAYERS = [
  { name: "Next.js (Vercel)", role: "User interface — forms, dashboard, chat and assistant pages." },
  { name: "FastAPI (backend)", role: "REST API, validation, orchestration of every AI call." },
  { name: "JWT Authentication", role: "Identity via signed tokens; bcrypt-hashed passwords; per-user data." },
  { name: "Business Logic", role: "Rule-based engine: trip category, daily budget, season, transport." },
  { name: "Amazon Bedrock", role: "Amazon Nova Lite generates itineraries and chat replies (Converse API)." },
  { name: "Knowledge Base (RAG)", role: "Answers grounded in trusted travel documents, with sources." },
  { name: "PostgreSQL (Neon)", role: "Users, trips, AI itineraries and conversation history." },
];

const PRINCIPLES = [
  "AI is a capability, not the whole application.",
  "LLMs are stateless — the application owns the memory.",
  "RAG improves trustworthiness with trusted knowledge.",
  "Security applies to AI applications too.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold text-slate-900">About Jalan-Jalan AI</h1>
      <p className="mt-4 text-lg text-slate-600">
        Jalan-Jalan AI is an AI-powered travel planner built during the AI Native Software Engineer Bootcamp. It turns a
        destination, number of days, budget and travel style into a personalized itinerary, answers factual travel
        questions from trusted documents, and holds natural multi-turn conversations.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Architecture</h2>
      <ol className="mt-4 space-y-3">
        {LAYERS.map((layer, index) => (
          <li key={layer.name} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{layer.name}</p>
              <p className="text-sm text-slate-600">{layer.role}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">AI Native principles</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {PRINCIPLES.map((principle) => (
          <li key={principle} className="rounded-2xl bg-teal-50 p-4 text-teal-900">✦ {principle}</li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">Plan a trip</Link>
        <Link href="/assistant" className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-white">
          Ask the assistant
        </Link>
      </div>
    </div>
  );
}
