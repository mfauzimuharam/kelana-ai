# Jalan-Jalan AI — AI-Powered Travel Planner

Jalan-Jalan AI turns a destination, number of days, budget and travel style into a personalized
day-by-day itinerary. It answers factual travel questions from trusted documents (RAG) and
holds natural multi-turn conversations that remember context.

Built during the **AI Native Software Engineer Bootcamp** with **Python, FastAPI, PostgreSQL,
Next.js and Amazon Bedrock**.

## Features

| Feature | Session |
| --- | --- |
| Trip summary console app (`backend/cli.py`) | 1 |
| Rule-based recommendation engine: category, daily budget, transport, season, places | 2 |
| REST API with Swagger docs (`/docs`) | 3 |
| PostgreSQL persistence with full CRUD | 4 |
| AI itineraries with Amazon Bedrock (Nova Lite, Converse API), stored as Markdown | 5 |
| Next.js UI: trip form, loading states, friendly errors | 6 |
| Trip dashboard: history, detail pages, search, sort, pagination | 7 |
| JWT authentication, bcrypt passwords, per-user data (403 on others' data), profile | 8 |
| RAG travel assistant with source citations (Bedrock Knowledge Base or local `knowledge/`) | 9 |
| Conversational chat with memory, sidebar, rename, auto-scroll, typing indicator, timestamps | 10 |
| Deployment configs for Vercel, Render/FastAPI Cloud and Neon | 11 |

## Architecture

```
Browser
  └─ Next.js (frontend/, Vercel)
       └─ FastAPI (backend/, Render or FastAPI Cloud)
            ├─ JWT auth ─ services/auth_service.py
            ├─ Business rules ─ services/trip_service.py
            ├─ Amazon Bedrock ─ services/bedrock_service.py   (itineraries, chat)
            ├─ RAG ─ services/kb_service.py                    (Knowledge Base / knowledge/)
            ├─ Memory ─ services/chat_service.py               (prompt builder, trimming)
            └─ PostgreSQL (Neon) ─ users, trips, conversations, messages
```

```
kelana-ai/
├── backend/            FastAPI app
│   ├── api/            route handlers (auth, trips, catalog, assistant, conversations)
│   ├── models/         SQLAlchemy models
│   ├── schemas/        Pydantic request/response models
│   ├── services/       business logic + AI integrations
│   ├── core/config.py  settings from environment variables
│   ├── tests/          pytest suite
│   ├── cli.py          console app (Sessions 1–2)
│   └── main.py         FastAPI entry point
├── frontend/           Next.js app (app/, components/, services/, types/, lib/)
├── knowledge/          RAG source documents
├── deployment/         deployment guide
└── render.yaml         Render blueprint for the backend
```

## Run locally

### Prerequisites
Python 3.12+, Node.js 20+, PostgreSQL 14+ (or use the SQLite fallback by leaving `DATABASE_URL` empty).

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                 # then fill in the values
createdb jalan_jalan_ai                   # or create it in pgAdmin/DBeaver
uvicorn main:app --reload
```

- API: http://localhost:8000 · Swagger UI: http://localhost:8000/docs
- No Bedrock access yet? Set `AI_MOCK_MODE=true` in `.env` to get clearly-labelled sample AI output.
- Console app: `python cli.py`
- Tests: `pytest`. They use SQLite and mock AI, so they need no AWS or PostgreSQL.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local           # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000, register an account and generate your first trip.

## Environment variables

| Backend (`backend/.env`) | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL, e.g. `postgresql+psycopg2://postgres:pass@localhost/jalan_jalan_ai` |
| `AWS_BEARER_TOKEN_BEDROCK` | Amazon Bedrock API key (read automatically by boto3) |
| `AWS_REGION` / `MODEL_ID` | `ap-southeast-2` / `amazon.nova-lite-v1:0` |
| `AI_MOCK_MODE` | `true` to skip Bedrock and return sample text |
| `KNOWLEDGE_BASE_ID` | Bedrock Knowledge Base ID; empty uses the local `knowledge/` folder |
| `JWT_SECRET_KEY` | long random string used to sign tokens |
| `CORS_ORIGINS` | allowed frontend origins (comma-separated) |

| Frontend (`frontend/.env.local`) | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | backend base URL |

Never commit `.env` files. They are gitignored.

## API overview

| Method & path | Auth | Description |
| --- | --- | --- |
| `GET /`, `GET /health` | – | welcome / health check |
| `POST /api/v1/auth/register` · `POST /api/v1/auth/login` | – | create account / get JWT |
| `GET /api/v1/auth/me` | ✓ | current user + trip and conversation counts |
| `POST /api/v1/trips` | ✓ | create trip (rules applied; `"generate": true` also calls Bedrock) |
| `GET /api/v1/trips?q=&sort=` | ✓ | list own trips (search + `latest`/`oldest`/`budget_desc`/`budget_asc`) |
| `GET · PUT · DELETE /api/v1/trips/{id}` | ✓ | read / update (recalculates rules) / delete (403 if not owner) |
| `POST /api/v1/trips/{id}/generate` | ✓ | generate and save the AI itinerary |
| `GET /api/v1/trip-categories` · `/transportations` · `/recommendations?destination=` | – | reference data |
| `POST /api/v1/assistant` (alias `/api/v1/ask`) | ✓ | RAG answer + sources |
| `POST · GET /api/v1/conversations` | ✓ | create / list conversations |
| `GET · PATCH · DELETE /api/v1/conversations/{id}` | ✓ | messages / rename / delete |
| `POST /api/v1/conversations/{id}/messages` | ✓ | send a message and get a context-aware AI reply |

## Business rules

| Total budget | Category | Transport |
| --- | --- | --- |
| < 1,000 | Backpacker | Bus |
| 1,000 – 3,000 | Standard | Train |
| > 3,000 | Luxury | Flight |

Daily budget = budget ÷ days. Season: December → Peak, June → Holiday, other months → Regular.

## Deployment

See [`deployment/README.md`](deployment/README.md) for step-by-step instructions covering Neon,
Render/FastAPI Cloud, Vercel and the Bedrock Knowledge Base, plus a release checklist.
