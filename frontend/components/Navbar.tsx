"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useHydrated } from "@/lib/useHydrated";

import { useAuth } from "./AuthProvider";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Plan a Trip" },
  { href: "/trips", label: "My Trips" },
  { href: "/assistant", label: "Assistant" },
  { href: "/chat", label: "Chat" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const auth = useAuth();
  const hydrated = useHydrated();
  const status = hydrated ? auth.status : "loading";
  const { user, logout } = auth;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive(href) ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {status === "authenticated" && user ? (
            <>
              <Link href="/profile" className="text-sm text-slate-600 hover:text-teal-700">
                Welcome back, <span className="font-semibold text-slate-900">{user.name.split(" ")[0]}</span> 👋
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : status === "guest" ? (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-teal-700">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Sign up
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {status === "authenticated" && user ? (
              <>
                <Link href="/profile" className={linkClass("/profile")} onClick={() => setOpen(false)}>
                  Profile ({user.name})
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass("/login")} onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className={linkClass("/register")} onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
