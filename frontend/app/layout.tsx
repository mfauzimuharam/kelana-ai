import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import Navbar from "@/components/Navbar";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "KelanaAI — AI Travel Planner", template: "%s · KelanaAI" },
  description:
    "Plan personalized trips with AI. KelanaAI generates itineraries with Amazon Bedrock, answers travel questions from trusted documents and remembers your conversations.",
  openGraph: {
    title: "KelanaAI — AI Travel Planner",
    description: "Personalized AI itineraries, a grounded travel assistant and conversational trip planning.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0d9488" };

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Logo />
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          {/* usePathname() is request data under Cache Components, so it needs Suspense. */}
          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
