export default function Spinner({ label, size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  const dimensions = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-[3px]", lg: "h-12 w-12 border-4" }[size];
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-slate-500">
      <span className={`${dimensions} animate-spin rounded-full border-teal-600 border-t-transparent`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
