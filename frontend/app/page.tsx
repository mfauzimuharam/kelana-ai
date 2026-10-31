"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import ErrorMessage from "@/components/ErrorMessage";
import Spinner from "@/components/Spinner";
import TripForm from "@/components/TripForm";
import { NEW_TRIP_KEY } from "@/lib/config";
import { useHydrated } from "@/lib/useHydrated";
import { getErrorMessage } from "@/services/api";
import { createTrip, generateTrip } from "@/services/tripService";
import type { Trip, TripInput } from "@/types";

const FEATURES = [
  { icon: "✨", title: "AI itineraries", text: "Day-by-day plans with morning, afternoon and evening activities from Amazon Bedrock." },
  { icon: "🧮", title: "Smart budgeting", text: "Instant trip category, daily budget, season and transport recommendation." },
  { icon: "📚", title: "Trusted answers", text: "Ask about visas, medication or baggage — answers grounded in real travel documents." },
  { icon: "💬", title: "Remembers context", text: "Chat naturally. Ask “what about Day 2?” and KelanaAI knows what you mean." },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0, transparent 35%), radial-gradient(circle at 80% 0%, #fde68a 0, transparent 30%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
        <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-medium">🌏 AI-powered travel planner</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Plan your next adventure with KelanaAI</h1>
        <p className="mt-4 max-w-2xl text-lg text-teal-50">
          Tell us where, how long and your budget. KelanaAI builds a personalized itinerary in seconds and keeps every trip in your dashboard.
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  const auth = useAuth();
  const hydrated = useHydrated();
  const status = hydrated ? auth.status : "loading";
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "saving" | "generating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingTrip, setPendingTrip] = useState<Trip | null>(null);

  async function runGeneration(trip: Trip) {
    setStage("generating");
    setError(null);
    try {
      await generateTrip(trip.id);
      sessionStorage.setItem(NEW_TRIP_KEY, String(trip.id));
      router.push("/trips"); // Session 7: redirect to the dashboard after generation
    } catch (err) {
      setPendingTrip(trip);
      setError(getErrorMessage(err));
      setStage("idle");
    }
  }

  async function handleSubmit(data: TripInput) {
    setStage("saving");
    setError(null);
    setPendingTrip(null);
    try {
      const trip = await createTrip(data);
      await runGeneration(trip);
    } catch (err) {
      setError(getErrorMessage(err));
      setStage("idle");
    }
  }

  return (
    <>
      <Hero />
      <div className="mx-auto -mt-10 grid max-w-6xl gap-8 px-4 pb-16 lg:grid-cols-5">
        <section className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-3 md:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Where do you want to go?</h2>
          <p className="mb-6 text-slate-500">Fill in your trip details and let AI do the planning.</p>

          {status === "loading" && <div className="py-10"><Spinner /></div>}

          {status === "guest" && (
            <div className="rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-slate-700">Create a free account to generate and save AI itineraries.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/register" className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">Get started</Link>
                <Link href="/login" className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-white">Login</Link>
              </div>
            </div>
          )}

          {(status === "authenticated" || status === "error") && (
            <>
              <TripForm
                submitLabel={stage === "saving" ? "Saving trip..." : stage === "generating" ? "Generating itinerary..." : "✨ Generate AI Trip"}
                busy={stage !== "idle"}
                onSubmit={handleSubmit}
              />
              {stage === "generating" && (
                <div className="mt-6 rounded-2xl bg-teal-50 p-6">
                  <Spinner label="Amazon Bedrock is crafting your itinerary — this usually takes 5–20 seconds..." />
                </div>
              )}
              {error && (
                <div className="mt-6 space-y-3">
                  <ErrorMessage
                    title="Unable to generate itinerary"
                    message={error}
                    onRetry={pendingTrip ? () => void runGeneration(pendingTrip) : undefined}
                  />
                  {pendingTrip && (
                    <p className="text-sm text-slate-600">
                      Your trip details were saved.{" "}
                      <Link href={`/trips/${pendingTrip.id}`} className="font-medium text-teal-700 underline">
                        Open the saved trip
                      </Link>{" "}
                      and generate the itinerary later.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4 lg:col-span-2 lg:pt-14">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <span aria-hidden className="text-2xl">{feature.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.text}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
