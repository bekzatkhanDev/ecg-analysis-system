# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# System libs needed to compile some Python packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip once, in the builder
RUN pip install --upgrade pip

COPY requirements.txt .

# Install PyTorch CPU-only first (avoids pulling the multi-GB CUDA wheel)
RUN pip install --no-cache-dir torch \
        --index-url https://download.pytorch.org/whl/cpu \
        --prefix /install

# Install remaining deps; torch is already satisfied from above
RUN pip install --no-cache-dir -r requirements.txt \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        --prefix /install


# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Non-root user
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --no-create-home appuser

# Carry over installed packages from builder
COPY --from=builder /install /usr/local

# Application source
COPY app/ ./app/

# ML model weights (baked into the image for a self-contained artifact)
COPY best_model_500hz.pth ./best_model_500hz.pth

# Persistent data directory — mount a named volume here in production
RUN mkdir /data && chown appuser:appgroup /data

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
