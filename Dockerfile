# syntax=docker/dockerfile:1

# ===============================================
# Stage 1: Dependencies
# ===============================================
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and Yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases

# Install dependencies
RUN corepack enable && yarn install --immutable

# ===============================================
# Stage 2: Build
# ===============================================
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to output standalone
ENV NEXT_TELEMETRY_DISABLED=1
# Set STANDALONE_BUILD=true to enable standalone output in next.config.mjs
ENV STANDALONE_BUILD=true

# Enable Corepack and Build the application
RUN corepack enable && yarn build

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
