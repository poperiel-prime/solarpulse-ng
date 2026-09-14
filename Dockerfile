# SolarPulse NG — production image (works on Railway, Render, Fly.io, any VPS).
#   docker build -t solarpulse-ng .
#   docker run -p 3000:3000 -e ADMIN_PIN=your-pin solarpulse-ng

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# The build only needs DATABASE_URL to exist (the app never queries it at
# runtime; /api/health is the sole consumer). Any placeholder works.
ARG DATABASE_URL=postgresql://localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "start"]
