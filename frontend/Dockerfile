# ── Stage 1: Node builder ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so Docker cache is reused when only source changes
COPY package.json package-lock.json ./

# Clean install from lockfile (reproducible, no network drift)
RUN npm ci --frozen-lockfile

COPY . .

RUN npm run build


# ── Stage 2: nginx runtime ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static build output
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx master process must stay as root to bind port 80,
# but worker processes run as the built-in 'nginx' user (non-root).
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
