"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useHydrated } from "@/lib/useHydrated";

import { useAuth } from "./AuthProvider";
import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";

/** Renders children only for logged-in users; guests are sent to /login. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const hydrated = useHydrated();
  const status = hydrated ? auth.status : "loading";
  const { error, refreshUser } = auth;
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status === "authenticated") return <>{children}</>;
  if (status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorMessage message={error ?? "Unable to load your account."} onRetry={() => void refreshUser()} />
      </div>
    );
  }
  return (
    <div className="flex justify-center py-24">
      <Spinner label="Loading your workspace..." />
    </div>
  );
}
