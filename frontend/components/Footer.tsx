import Link from "next/link";

import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Logo />
          <p>Your AI-powered travel planner — built with FastAPI, Next.js & Amazon Bedrock.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-teal-700">About</Link>
          <Link href="/trips" className="hover:text-teal-700">My Trips</Link>
          <Link href="/assistant" className="hover:text-teal-700">Travel Assistant</Link>
          <Link href="/chat" className="hover:text-teal-700">Chat</Link>
        </div>
        <p>© 2026 KelanaAI · AI Native Software Engineer Bootcamp</p>
      </div>
    </footer>
  );
}
