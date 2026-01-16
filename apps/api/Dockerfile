# ============================================
# Stage 1: Pruner (Prepare minimal scope)
# ============================================
# Note: Since we are manual copying, we skip 'turbo prune' for now to match current repo structure validity,
# but we optimize the install layer.

# ============================================
# Stage 1: Dependencies & Builder
# ============================================
FROM node:20-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /apps

# Enable corepack for Yarn Berry
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Set Yarn cache folder
ENV YARN_CACHE_FOLDER=/root/.yarn/berry/cache

# Copy root config
COPY package.json yarn.lock .yarnrc.yml ./

# Override nmMode in .yarnrc.yml to use classic instead of hardlinks-local
RUN sed -i 's/nmMode: hardlinks-local/nmMode: classic/' .yarnrc.yml && \
    cat .yarnrc.yml

# Copy workspace headers
COPY apps/api/package.json ./apps/api/
COPY apps/native/package.json ./apps/native/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies (utilizing cache mount)
# --mount=type=cache persists /root/.yarn/berry/cache between builds
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn install --immutable
# Copy full source code
COPY apps/api ./apps/api
COPY packages ./packages

# Re-run install to ensure all workspace dependencies are installed
# Yarn Berry may defer some installs until source code is present
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn install --immutable

# Debug: Check if node_modules has content in BUILDER (after second install)
RUN echo "=== BUILDER: Checking node_modules AFTER source copy ===" && \
    ls -la node_modules/ | head -20 && \
    echo "=== BUILDER: Checking @nestjs ===" && \
    ls -la node_modules/@nestjs/ | head -10 || echo "No @nestjs in builder!"

# Build shared packages and API
RUN yarn workspace @repo/shared build
RUN yarn workspace api build

# Debug: Verify @nestjs/core is installed after build
RUN ls -la node_modules/@nestjs/ || echo "No @nestjs in root node_modules" && \
    ls -la apps/api/node_modules/@nestjs/ 2>/dev/null || echo "No @nestjs in api node_modules"

# ============================================
# Stage 2: Runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /apps

ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production node_modules from builder stage
COPY --from=builder --chown=nestjs:nodejs /apps/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /apps/apps/api/dist ./dist

# Copy built shared package
COPY --from=builder --chown=nestjs:nodejs /apps/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /apps/packages/shared/package.json ./packages/shared/package.json

# Copy package.json for proper module resolution
COPY --from=builder --chown=nestjs:nodejs /apps/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /apps/apps/api/package.json ./apps/api/package.json

USER nestjs

EXPOSE 3000

# Debug: List structure before running
RUN ls -la /apps/ && \
    ls -la /apps/node_modules/@nestjs/ | head -20 && \
    echo "--- Checking if @nestjs/core exists ---" && \
    ls -la /apps/node_modules/@nestjs/core/

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
