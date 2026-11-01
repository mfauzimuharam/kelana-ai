"use client";

import { useState } from "react";

import { CURRENCIES, MONTHS, TRAVEL_STYLES } from "@/lib/format";
import type { Trip, TripInput } from "@/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none disabled:bg-slate-100";
const labelClass = "mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase";

interface Props {
  initial?: Partial<Trip>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (data: TripInput) => void;
  compact?: boolean;
}

export default function TripForm({ initial, submitLabel, busy = false, onSubmit, compact = false }: Props) {
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [days, setDays] = useState(String(initial?.days ?? 5));
  const [budget, setBudget] = useState(String(initial?.budget ?? 2000));
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [travelStyle, setTravelStyle] = useState(initial?.travel_style ?? "Family");
  const [travelMonth, setTravelMonth] = useState(initial?.travel_month ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dayCount = Number(days);
    const amount = Number(budget);
    if (!destination.trim()) return setError("Please enter a destination.");
    if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 60) return setError("Days must be a whole number between 1 and 60.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Budget must be greater than 0.");
    setError(null);
    onSubmit({
      destination: destination.trim(),
      country: country.trim() || null,
      days: dayCount,
      budget: amount,
      currency,
      travel_style: travelStyle || null,
      travel_month: travelMonth || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        <div>
          <label htmlFor="destination" className={labelClass}>Destination</label>
          <input id="destination" className={inputClass} placeholder="e.g. Japan, Bali, Seoul" value={destination}
            onChange={(e) => setDestination(e.target.value)} disabled={busy} required />
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>Country (optional)</label>
          <input id="country" className={inputClass} placeholder="e.g. Japan" value={country}
            onChange={(e) => setCountry(e.target.value)} disabled={busy} />
        </div>
        <div>
          <label htmlFor="days" className={labelClass}>Days</label>
          <input id="days" type="number" min={1} max={60} className={inputClass} value={days}
            onChange={(e) => setDays(e.target.value)} disabled={busy} required />
        </div>
        <div>
          <label htmlFor="budget" className={labelClass}>Budget</label>
          <div className="flex gap-2">
            <select aria-label="Currency" className={`${inputClass} w-28`} value={currency}
              onChange={(e) => setCurrency(e.target.value)} disabled={busy}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input id="budget" type="number" min={1} step="any" className={inputClass} value={budget}
              onChange={(e) => setBudget(e.target.value)} disabled={busy} required />
          </div>
        </div>
        <div>
          <label htmlFor="style" className={labelClass}>Travel style</label>
          <select id="style" className={inputClass} value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} disabled={busy}>
            {TRAVEL_STYLES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="month" className={labelClass}>Month of travel (optional)</label>
          <select id="month" className={inputClass} value={travelMonth} onChange={(e) => setTravelMonth(e.target.value)} disabled={busy}>
            <option value="">Not decided</option>
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {submitLabel}
      </button>
    </form>
  );
}
