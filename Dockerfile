# ── Base ─────────────────────────────────────────────────────────
FROM node:24-alpine AS base
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build ────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy build-time values so `next build` can statically analyze
# Payload's config; real values are injected at runtime via env_file.
ENV DATABASE_URI=postgres://placeholder:placeholder@placeholder:5432/placeholder
ENV PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/storage && chown -R nextjs:nodejs /app/storage

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
