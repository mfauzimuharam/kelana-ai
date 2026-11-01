import { Suspense } from "react";

import Spinner from "@/components/Spinner";

import TripDetail from "./TripDetail";

// Dynamic route: /trips/1, /trips/2 ... — one template, many trips.
export default function TripDetailPage() {
  return (
    <Suspense fallback={<div className="py-24"><Spinner label="Loading trip..." /></div>}>
      <TripDetail />
    </Suspense>
  );
}
