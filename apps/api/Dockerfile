# ==========================================
# Stage 1: Prune (Lọc source code cần thiết)
# ==========================================
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Cài turbo global để dùng lệnh prune
RUN npm install turbo --global
COPY . .
# Lệnh này sẽ tạo ra folder 'out' chỉ chứa những gì 'api' cần
RUN turbo prune --scope=api --docker

# ==========================================
# Stage 2: Builder (Cài đặt & Build)
# ==========================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Copy file cấu hình package (package.json, lockfile) từ bước Prune
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock

# 2. Cài đặt dependencies (Lúc này yarn chỉ cài những gì api cần)
RUN corepack enable && corepack prepare yarn@4.12.0 --activate
# Tạo .yarnrc.yml để ép dùng node-modules (tránh lỗi PnP trong Docker)
RUN echo 'nodeLinker: node-modules' > .yarnrc.yml
RUN yarn install --frozen-lockfile

# 3. Copy source code đầy đủ từ bước Prune
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# 4. Build dự án
RUN yarn turbo run build --filter=api...

# ==========================================
# Stage 3: Runner (Chạy ứng dụng)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Tạo user non-root bảo mật
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy dependencies và code đã build
# Lưu ý: Copy cả node_modules từ builder đảm bảo đủ package
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json

# (Quan trọng) Copy shared package đã build (nếu có) để đảm bảo symlink hoạt động
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/main.js"]