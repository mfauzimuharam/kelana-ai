import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl" aria-hidden>🧭</p>
      <p className="mt-6 text-sm font-semibold tracking-wide text-teal-700 uppercase">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">This destination doesn&apos;t exist</h1>
      <p className="mt-2 text-slate-500">The page you are looking for may have moved or never existed.</p>
      <Link href="/" className="mt-8 inline-block rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">
        Back to home
      </Link>
    </div>
  );
}
