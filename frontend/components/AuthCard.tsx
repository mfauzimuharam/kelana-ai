import Logo from "./Logo";

export const authInputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none";
export const authLabelClass = "mb-1 block text-xs font-semibold tracking-wide text-slate-600 uppercase";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <Logo className="mb-6" />
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mb-6 text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
