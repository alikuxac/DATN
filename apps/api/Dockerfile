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
RUN apk add --no-cache libc6-compat

WORKDIR /apps

# Enable corepack for Yarn Berry
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Set Yarn cache folder
ENV YARN_CACHE_FOLDER=/root/.yarn/berry/cache

# Copy root config
COPY package.json yarn.lock .yarnrc.yml ./

# Copy workspace headers
COPY apps/api/package.json ./apps/api/
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

# Build shared packages and API
# Assuming 'turbo' is configured to handle deps, or manual ordering:
RUN yarn workspace @alikuxac/shared build
RUN yarn workspace @alikuxac/api build

# ============================================
# Stage 2: Production Dependencies (Focused)
# ============================================
FROM node:20-alpine AS production-deps
RUN apk add --no-cache libc6-compat
WORKDIR /apps

RUN corepack enable && corepack prepare yarn@4.12.0 --activate
ENV YARN_CACHE_FOLDER=/root/.yarn/berry/cache

COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install ONLY production dependencies for the API
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn workspaces focus --production @alikuxac/api

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /apps

ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy dist from builder
COPY --from=builder --chown=nestjs:nodejs /apps/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /apps/packages/shared/dist ./packages/shared/dist

# Copy production node_modules
COPY --from=production-deps --chown=nestjs:nodejs /apps/node_modules ./node_modules
# Optional: Copy shared package node_modules if they exist (handling potential absence with wildcard or just skipping if satisfied by root)
# The safest way is to trust root node_modules for hoisted deps.
# COPY --from=production-deps --chown=nestjs:nodejs /apps/packages/shared/node_modules ./packages/shared/node_modules

# Ensure permissions
COPY --chown=nestjs:nodejs apps/api/package.json ./package.json
COPY --chown=nestjs:nodejs packages/shared/package.json ./packages/shared/package.json

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
