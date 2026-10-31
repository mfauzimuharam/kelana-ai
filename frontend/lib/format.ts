import type { TripCategory } from "@/types";

/** 2000 → "USD 2,000" */
export function formatMoney(amount: number, currency = "USD"): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const DESTINATION_ICONS: Record<string, string> = {
  japan: "🇯🇵", tokyo: "🗼", kyoto: "⛩️", osaka: "🏯",
  bali: "🏝️", indonesia: "🇮🇩", jakarta: "🇮🇩", lombok: "🏝️", yogyakarta: "🛕",
  singapore: "🇸🇬", korea: "🇰🇷", "south korea": "🇰🇷", seoul: "🇰🇷", busan: "🇰🇷",
  paris: "🗼", france: "🇫🇷", london: "🇬🇧", "united kingdom": "🇬🇧", rome: "🏛️", italy: "🇮🇹",
  "new york": "🗽", usa: "🇺🇸", "united states": "🇺🇸",
  mecca: "🕋", medina: "🕌", "saudi arabia": "🇸🇦",
  istanbul: "🕌", turkey: "🇹🇷", cairo: "🇪🇬", egypt: "🇪🇬", dubai: "🇦🇪",
  thailand: "🇹🇭", bangkok: "🇹🇭", malaysia: "🇲🇾", "kuala lumpur": "🇲🇾",
  vietnam: "🇻🇳", australia: "🇦🇺", sydney: "🇦🇺", china: "🇨🇳", "hong kong": "🇭🇰",
};

export function destinationIcon(destination: string, country?: string | null): string {
  const keys = [destination, country ?? ""].map((v) => v.trim().toLowerCase());
  for (const key of keys) {
    if (key && DESTINATION_ICONS[key]) return DESTINATION_ICONS[key];
  }
  return "✈️";
}

export const CATEGORY_STYLES: Record<TripCategory, string> = {
  Backpacker: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Standard: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Luxury: "bg-amber-50 text-amber-800 ring-amber-600/25",
};

export const TRAVEL_STYLES = ["Solo", "Couple", "Family", "Friends", "Business"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const CURRENCIES = ["USD", "IDR", "EUR", "JPY", "SGD", "KRW", "AUD"];
