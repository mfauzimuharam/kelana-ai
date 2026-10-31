export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#0d9488" />
        <path d="M7 21.5 25 11l-6.5 14-3.2-5.6L7 21.5Z" fill="#fff" />
        <path d="m15.3 19.4 9.7-8.4" stroke="#0d9488" strokeWidth="1.4" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Kelana<span className="text-teal-600">AI</span>
      </span>
    </span>
  );
}
