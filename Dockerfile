# syntax=docker/dockerfile:1

# ===============================================
# Stage 1: Dependencies
# ===============================================
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --frozen-lockfile

# ===============================================
# Stage 2: Build
# ===============================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to output standalone
ENV NEXT_TELEMETRY_DISABLED=1
# Set STANDALONE_BUILD=true to enable standalone output in next.config.mjs
ENV STANDALONE_BUILD=true

# Build the application
RUN yarn build

# ===============================================
# Stage 3: Production Runner
# ===============================================
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets
COPY --from=builder /app/public ./public

# Copy the standalone build output
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static

# Switch to non-root user
USER nonroot

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
