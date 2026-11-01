"""Jalan-Jalan AI REST API (FastAPI).

Run locally:  uvicorn main:app --reload      (from the backend/ folder)
Swagger UI:   http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import assistant, auth, catalog, conversations, trips
from core import config
from database import init_db


# Create tables as soon as the app is imported. Serverless platforms (Vercel)
# start and stop instances often and may not run lifespan events reliably.
init_db()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()  # idempotent — safe to run again on startup
    yield


app = FastAPI(
    title="Jalan-Jalan AI API",
    description="AI-powered travel planner — FastAPI + PostgreSQL + Amazon Bedrock.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the Next.js frontend (localhost:3000 in dev, Vercel in production).
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def home():
    return {"message": "Welcome to Jalan-Jalan AI"}


@app.get("/health", tags=["General"])
def health():
    return {"status": "OK"}


app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(catalog.router)
app.include_router(assistant.router)
app.include_router(conversations.router)
