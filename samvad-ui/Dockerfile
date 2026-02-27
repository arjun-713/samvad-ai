# ══════════════════════════════════════════════
# Frontend Dockerfile — Multi-stage with nginx
# ══════════════════════════════════════════════

# ── Stage 1: Build static assets ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (maximizes cache — package.json changes rarely)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx (~25MB final image) ──
FROM nginx:alpine AS runtime

# Custom nginx config with API reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
