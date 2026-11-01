"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ErrorMessage from "@/components/ErrorMessage";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";
import TripCard from "@/components/TripCard";
import { NEW_TRIP_KEY } from "@/lib/config";
import { getErrorMessage } from "@/services/api";
import { getTrips } from "@/services/tripService";
import type { Trip, TripSort } from "@/types";

const PAGE_SIZE = 9;

const SORT_OPTIONS: { value: TripSort; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "budget_desc", label: "Highest budget" },
  { value: "budget_asc", label: "Lowest budget" },
];

function sortTrips(trips: Trip[], sort: TripSort): Trip[] {
  const copy = [...trips];
  const time = (t: Trip) => new Date(t.created_at).getTime();
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => time(a) - time(b) || a.id - b.id);
    case "budget_desc":
      return copy.sort((a, b) => b.budget - a.budget);
    case "budget_asc":
      return copy.sort((a, b) => a.budget - b.budget);
    default:
      return copy.sort((a, b) => time(b) - time(a) || b.id - a.id);
  }
}

function readNewTripId(): number | null {
  try {
    const value = sessionStorage.getItem(NEW_TRIP_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

function TripDashboard() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TripSort>("latest");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [newTripId] = useState<number | null>(() => (typeof window === "undefined" ? null : readNewTripId()));

  useEffect(() => {
    // Highlight the new trip once; forget it so a refresh shows the normal list.
    try {
      sessionStorage.removeItem(NEW_TRIP_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTrips()
      .then((data) => {
        if (!cancelled) {
          setTrips(data);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Search + sort run on every keystroke, client-side (Session 7 challenge).
  const visible = useMemo(() => {
    if (!trips) return [];
    const term = search.trim().toLowerCase();
    const filtered = term
      ? trips.filter((t) =>
          [t.destination, t.country ?? "", t.travel_style ?? ""].some((field) => field.toLowerCase().includes(term)),
        )
      : trips;
    return sortTrips(filtered, sort);
  }, [trips, search, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trip History</h1>
          <p className="text-slate-500">
            {trips ? `${trips.length} saved ${trips.length === 1 ? "itinerary" : "itineraries"}` : "Your saved itineraries"}
          </p>
        </div>
        <Link href="/" className="rounded-xl bg-teal-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-teal-700">
          + Generate a trip
        </Link>
      </div>

      {trips && trips.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Search trips by destination or travel style..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
          />
          <select
            aria-label="Sort trips"
            value={sort}
            onChange={(e) => setSort(e.target.value as TripSort)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm focus:border-teal-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <ErrorMessage title="Unable to load your trips" message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!trips && !error && (
        <div className="py-20"><Spinner label="Loading your trips..." /></div>
      )}

      {trips && trips.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-5xl" aria-hidden>✈️</p>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">No trips found.</h2>
          <p className="mt-1 text-slate-500">Create your first itinerary and it will appear here.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">
            Generate a Trip →
          </Link>
        </div>
      )}

      {trips && trips.length > 0 && visible.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500">No trips match “{search}”.</p>
      )}

      {pageItems.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((trip) => (
            <TripCard key={trip.id} trip={trip} isNew={trip.id === newTripId} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40">
            ← Previous
          </button>
          <span className="px-2 text-sm text-slate-600">Page {currentPage} of {pageCount}</span>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40">
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <RequireAuth>
      <TripDashboard />
    </RequireAuth>
  );
}
