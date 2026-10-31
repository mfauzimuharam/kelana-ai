"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CategoryBadge, StyleBadge } from "@/components/Badges";
import ErrorMessage from "@/components/ErrorMessage";
import Itinerary from "@/components/Itinerary";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";
import TripForm from "@/components/TripForm";
import { destinationIcon, formatDate, formatMoney } from "@/lib/format";
import { ApiError, getErrorMessage } from "@/services/api";
import { deleteTrip, generateTrip, getTrip, updateTrip } from "@/services/tripService";
import type { Trip, TripInput } from "@/types";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function TripView({ id }: { id: number }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadError, setLoadError] = useState<{ message: string; status: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTrip(id)
      .then((data) => {
        if (!cancelled) {
          setTrip(data);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError({ message: getErrorMessage(err), status: err instanceof ApiError ? err.status : 0 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  async function handleGenerate() {
    setGenerating(true);
    setActionError(null);
    try {
      const result = await generateTrip(id);
      setTrip((current) => (current ? { ...current, ai_recommendation: result.recommendation } : current));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleUpdate(data: TripInput) {
    setSaving(true);
    setActionError(null);
    try {
      setTrip(await updateTrip(id, data));
      setEditing(false);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteTrip(id);
      router.push("/trips");
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(false);
    }
  }

  if (loadError) {
    const notFound = loadError.status === 404 || loadError.status === 403;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {notFound ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-5xl" aria-hidden>🧭</p>
            <h1 className="mt-4 text-2xl font-semibold">Trip not found</h1>
            <p className="mt-1 text-slate-500">{loadError.message}</p>
            <Link href="/trips" className="mt-6 inline-block font-semibold text-teal-700">← Back to Trips</Link>
          </div>
        ) : (
          <ErrorMessage title="Unable to load trip" message={loadError.message} onRetry={() => setReloadKey((k) => k + 1)} />
        )}
      </div>
    );
  }

  if (!trip) return <div className="py-24"><Spinner label="Loading trip..." /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/trips" className="text-sm font-medium text-teal-700 hover:underline">← Back to Trips</Link>

      <header className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <span aria-hidden className="text-5xl">{destinationIcon(trip.destination, trip.country)}</span>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{trip.destination}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <CategoryBadge category={trip.category} />
                <StyleBadge style={trip.travel_style} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing((v) => !v)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {editing ? "Cancel edit" : "Edit trip"}
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Budget" value={formatMoney(trip.budget, trip.currency)} />
          <Stat label="Days" value={`${trip.days} ${trip.days === 1 ? "day" : "days"}`} />
          <Stat label="Daily budget" value={`${formatMoney(trip.daily_budget, trip.currency)}/day`} />
          <Stat label="Transport" value={trip.recommended_transport} />
          {trip.country && <Stat label="Country" value={trip.country} />}
          {trip.travel_month && <Stat label="Travel month" value={trip.travel_month} />}
          {trip.season && <Stat label="Season" value={trip.season} />}
          <Stat label="Created" value={formatDate(trip.created_at)} />
        </div>

        {editing && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="mb-1 font-semibold text-slate-900">Edit trip</h2>
            <p className="mb-4 text-sm text-slate-500">Category, daily budget and transport are recalculated automatically.</p>
            <TripForm initial={trip} submitLabel={saving ? "Saving..." : "Save changes"} busy={saving} onSubmit={handleUpdate} />
          </div>
        )}
      </header>

      {actionError && <div className="mt-6"><ErrorMessage message={actionError} onRetry={trip.ai_recommendation ? undefined : handleGenerate} /></div>}

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">✨ AI Recommendation</h2>
          {trip.ai_recommendation && (
            <button type="button" onClick={handleGenerate} disabled={generating}
              className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50">
              {generating ? "Regenerating..." : "↻ Regenerate"}
            </button>
          )}
        </div>

        {generating ? (
          <div className="rounded-2xl bg-teal-50 p-10">
            <Spinner label="Amazon Bedrock is thinking — generating your itinerary..." />
          </div>
        ) : trip.ai_recommendation ? (
          <Itinerary markdown={trip.ai_recommendation} />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">This trip does not have an AI itinerary yet.</p>
            <button type="button" onClick={handleGenerate}
              className="mt-4 rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">
              ✨ Generate AI itinerary
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function TripDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <RequireAuth>
      {Number.isInteger(id) && id > 0 ? (
        <TripView key={id} id={id} />
      ) : (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Invalid trip link</h1>
          <Link href="/trips" className="mt-4 inline-block font-semibold text-teal-700">← Back to Trips</Link>
        </div>
      )}
    </RequireAuth>
  );
}
