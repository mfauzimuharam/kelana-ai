# Jalan-Jalan AI Frontend (Next.js)

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                  # http://localhost:3000
```

| Route | Page |
| --- | --- |
| `/` | Hero + trip form, generates an AI itinerary, then redirects to `/trips` |
| `/login`, `/register` | Authentication (JWT stored in localStorage) |
| `/trips` | Trip history: search, sort, pagination, empty state |
| `/trips/[id]` | Trip detail: AI itinerary cards, edit, regenerate, delete |
| `/assistant` | RAG travel assistant with source documents |
| `/chat` | Conversational AI with sidebar, rename, auto-scroll, typing indicator |
| `/profile` | Name, email, total trips and conversations |
| `/about` | Architecture overview |

Folders: `app/` (routes), `components/` (reusable UI), `services/` (all API calls),
`types/` (TypeScript interfaces) and `lib/` (config and formatting helpers).

Checks: `npx eslint .` and `npm run build`.
