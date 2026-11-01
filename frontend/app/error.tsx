"use client";

import Link from "next/link";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl" aria-hidden>⛈️</p>
      <p className="mt-6 text-sm font-semibold tracking-wide text-rose-600 uppercase">500</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Turbulence ahead</h1>
      <p className="mt-2 text-slate-500">Something unexpected happened. Please try again.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={() => retry()}
          className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">
          Try again
        </button>
        <Link href="/" className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-white">
          Home
        </Link>
      </div>
    </div>
  );
}
