import Link from "next/link";

import { destinationIcon, formatDate, formatMoney } from "@/lib/format";
import type { Trip } from "@/types";

import { CategoryBadge, StyleBadge } from "./Badges";

export default function TripCard({ trip, isNew = false }: { trip: Trip; isNew?: boolean }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isNew ? "border-teal-400 ring-2 ring-teal-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">{destinationIcon(trip.destination, trip.country)}</span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-teal-700">{trip.destination}</h3>
            {trip.country && trip.country.toLowerCase() !== trip.destination.toLowerCase() && (
              <p className="text-sm text-slate-500">{trip.country}</p>
            )}
          </div>
        </div>
        {isNew && <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">New</span>}
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {trip.days} {trip.days === 1 ? "day" : "days"} · {formatMoney(trip.budget, trip.currency)}
        {trip.travel_month ? ` · ${trip.travel_month}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <CategoryBadge category={trip.category} />
        <StyleBadge style={trip.travel_style} />
        {!trip.ai_recommendation && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            No AI plan yet
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="text-slate-400">{formatDate(trip.created_at)}</span>
        <span className="font-medium text-teal-700">View details →</span>
      </div>
    </Link>
  );
}
