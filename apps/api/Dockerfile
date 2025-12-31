# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

WORKDIR /apps

# Copy root package.json and lockfile (monorepo)
COPY package.json yarn.lock* ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install all dependencies (monorepo workspaces)
RUN yarn install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /apps

# Copy dependencies from deps stage
COPY --from=deps /apps/node_modules ./node_modules
COPY --from=deps /apps/package.json ./package.json

# Copy workspace packages (shared dependencies)
COPY packages ./packages

# Build shared package first (required by API)
WORKDIR /apps/packages/shared
RUN yarn build

# Copy API source code
WORKDIR /apps
COPY apps/api ./apps/api

# Build the API application
WORKDIR /apps/apps/api
RUN yarn build

# ============================================
# Stage 3: Production Dependencies
# ============================================
FROM node:20-alpine AS production-deps

RUN apk add --no-cache libc6-compat

WORKDIR /apps

# Copy package files
COPY package.json yarn.lock* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
ENV NODE_ENV=production
RUN yarn install --production --frozen-lockfile

# Cleanup unnecessary files
RUN find . -name "*.md" -type f -delete && \
    find . -name "*.map" -type f -delete && \
    find ./node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find ./node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find ./node_modules -name "*.spec.js" -type f -delete && \
    find ./node_modules -name "*.test.js" -type f -delete && \
    yarn cache clean

# ============================================
# Stage 4: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /apps

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /apps/apps/api/dist ./dist

# Copy ONLY production node_modules
COPY --from=production-deps --chown=nestjs:nodejs /apps/node_modules ./node_modules
COPY --from=production-deps --chown=nestjs:nodejs /apps/apps/api/node_modules ./apps/api/node_modules

# Copy package.json
COPY --from=builder --chown=nestjs:nodejs /apps/apps/api/package.json ./package.json

# Copy shared package if needed at runtime (built dist from builder)
COPY --from=builder --chown=nestjs:nodejs /apps/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /apps/packages/shared/package.json ./packages/shared/package.json

# Switch to non-root user
USER nestjs

# Expose port (default NestJS port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]
