"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AuthCard, { authInputClass, authLabelClass } from "@/components/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { getErrorMessage } from "@/services/api";
import { register } from "@/services/authService";

export default function RegisterPage() {
  const { status, login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
      await login(email.trim(), password);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Your trips and conversations stay private to you.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={authLabelClass}>Name</label>
          <input id="name" autoComplete="name" required className={authInputClass} placeholder="Alice"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className={authLabelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" required className={authInputClass}
            placeholder="alice@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className={authLabelClass}>Password</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={8}
            className={authInputClass} placeholder="At least 8 characters"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirm" className={authLabelClass}>Confirm password</label>
          <input id="confirm" type="password" autoComplete="new-password" required className={authInputClass}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal-700 hover:underline">Login</Link>
      </p>
    </AuthCard>
  );
}
