// All trip-related API calls live here (Session 7: pages render, services fetch).
import type { GenerateResponse, Trip, TripInput, TripSort } from "@/types";

import { request } from "./api";

export function getTrips(params: { q?: string; sort?: TripSort } = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  const suffix = query.toString() ? `?${query}` : "";
  return request<Trip[]>(`/trips${suffix}`);
}

export function getTrip(id: number) {
  return request<Trip>(`/trips/${id}`);
}

export function createTrip(data: TripInput) {
  return request<Trip>("/trips", { method: "POST", body: JSON.stringify(data) });
}

export function updateTrip(id: number, data: Partial<TripInput>) {
  return request<Trip>(`/trips/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteTrip(id: number) {
  return request<void>(`/trips/${id}`, { method: "DELETE" });
}

export function generateTrip(id: number) {
  return request<GenerateResponse>(`/trips/${id}/generate`, { method: "POST" });
}
