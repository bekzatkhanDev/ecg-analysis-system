"""
ECG Analysis System — FastAPI application.
Model loaded once at startup (lifespan). JWT auth, SQLite, POST /api/ecg/analyze.
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.endpoints import auth, ecg, users
from app.core.config import settings
from app.db.base import Base, engine
from app.db import models  # noqa: F401 — register ORM models
from app.services.ml_service import ModelService

# Create tables when app module loads (so DB is ready before first request)
Base.metadata.create_all(bind=engine)

# Auto-migrate: add 'role' column to users table if it doesn't exist yet
with engine.connect() as conn:
    inspector = inspect(engine)
    existing_cols = {col["name"] for col in inspector.get_columns("users")}
    if "role" not in existing_cols:
        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'doctor'"))
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load ML model. Shutdown: nothing."""
    model_service = ModelService()
    try:
        path = Path(settings.model_weights_path)
        if not path.is_absolute():
            path = Path(__file__).resolve().parent.parent / path
        if path.exists():
            model_service.load_model()
        # If weights missing, model will load on first /analyze (optional)
    except Exception:
        pass
    yield
    # teardown if needed


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(ecg.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
