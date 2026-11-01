"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import { formatDate } from "@/lib/format";

function Profile() {
  const { user, refreshUser } = useAuth();

  // Refresh counters (trips / conversations) every time the page opens.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  if (!user) return null;
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-2xl font-bold text-white">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-500">{user.email}</p>
            <p className="text-sm text-slate-400">Member since {formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/trips" className="rounded-2xl bg-teal-50 p-5 hover:bg-teal-100">
            <p className="text-sm font-semibold text-teal-800">Total Trips Generated</p>
            <p className="mt-1 text-4xl font-bold text-teal-900">{user.total_trips}</p>
          </Link>
          <Link href="/chat" className="rounded-2xl bg-violet-50 p-5 hover:bg-violet-100">
            <p className="text-sm font-semibold text-violet-800">Conversations</p>
            <p className="mt-1 text-4xl font-bold text-violet-900">{user.total_conversations}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}
