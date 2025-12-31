# Docker Setup Guide - DATN API

## 📋 Yêu Cầu

- Docker Engine 20.10+
- Docker Compose 2.0+
- External Services:
  - MongoDB Atlas/Cloud
  - Redis (Upstash/Redis Cloud)
  - Email Service (Resend/SendGrid)

## 🚀 Quick Start

### 1. Chuẩn Bị Environment Variables

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa .env với thông tin external services của bạn
```

### 2. Chuẩn Bị JWT Keys (Nếu Sử Dụng RS256)

```bash
# Tạo thư mục keys
mkdir -p keys

# Generate private key cho access token
openssl genrsa -out keys/access-token-private.pem 2048

# Generate public key cho access token
openssl rsa -in keys/access-token-private.pem -pubout -out keys/access-token-public.pem

# Generate private key cho refresh token
openssl genrsa -out keys/refresh-token-private.pem 2048

# Generate public key cho refresh token
openssl rsa -in keys/refresh-token-private.pem -pubout -out keys/refresh-token-public.pem

# Set permissions
chmod 600 keys/*.pem
```

### 3. Build và Run

#### Production Mode

```bash
# Build image
docker-compose build

# Start container
docker-compose up -d

# Xem logs
docker-compose logs -f api

# Stop container
docker-compose down
```

#### Development Mode

```bash
# Start với hot reload
docker-compose -f docker-compose.dev.yml up

# Hoặc chạy background
docker-compose -f docker-compose.dev.yml up -d

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f api-dev
```

## 🔧 Các Lệnh Hữu Ích

### Container Management

```bash
# Restart container
docker-compose restart api

# Xem status
docker-compose ps

# Exec vào container
docker exec -it datn-api sh

# Xem resource usage
docker stats datn-api
```

### Logs & Debugging

```bash
# Xem logs realtime
docker-compose logs -f api

# Xem 100 dòng logs cuối
docker-compose logs --tail=100 api

# Xem logs với timestamp
docker-compose logs -t api
```

### Image Management

```bash
# Rebuild image (no cache)
docker-compose build --no-cache

# Xóa image cũ
docker image prune -a

# Xem image size
docker images | grep datn-api
```

## 🏗️ Multi-Stage Build Architecture

Dockerfile sử dụng 3 stages để tối ưu:

1. **deps**: Install dependencies
2. **builder**: Build application
3. **runner**: Production runtime (minimal size)

### Image Size Optimization

- Base image: `node:20-alpine` (~40MB)
- Working directory: `/apps` (tránh nhầm lẫn với app name)
- **Final image: ~390MB** (optimized với production deps only)
- Multi-stage build với 4 stages (deps, builder, production-deps, runner)
- Cleanup unnecessary files (*.md, *.ts, *.map, test directories)
- Không bao gồm dev dependencies

## 🔒 Security Best Practices

### Container Security

- ✅ Non-root user (`nestjs:nodejs`)
- ✅ Read-only volumes cho sensitive files
- ✅ Health check enabled
- ✅ Resource limits (có thể config)
- ✅ Minimal base image (Alpine)

### Network Security

```yaml
# Thêm vào docker-compose.yml nếu cần restrict network
services:
  api:
    networks:
      - internal
    # Chỉ expose port cần thiết
```

### Environment Variables

- ⚠️ **KHÔNG** commit file `.env` vào Git
- ✅ Sử dụng `.env.example` làm template
- ✅ Sử dụng secrets management cho production (AWS Secrets Manager, Vault)

## 📊 Health Check

API có built-in health check endpoint:

```bash
# Check health
curl http://localhost:3000/api/health

# Docker health status
docker inspect --format='{{.State.Health.Status}}' datn-api
```

## 🌐 External Services Configuration

### MongoDB Atlas

```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### Upstash Redis

```env
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### Resend Email

```env
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

## 🐛 Troubleshooting

### Container không start

```bash
# Check logs
docker-compose logs api

# Check container status
docker ps -a | grep datn-api

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Port đã được sử dụng

```bash
# Thay đổi port trong .env
HTTP_PORT=3001

# Hoặc trong docker-compose.yml
ports:
  - "3001:3000"
```

### Memory issues

```bash
# Thêm resource limits vào docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 📝 Production Deployment

### Docker Swarm

```bash
docker stack deploy -c docker-compose.yml datn
```

### Kubernetes

```bash
# Convert docker-compose to k8s manifests
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f .
```

### Cloud Platforms

- **AWS ECS**: Sử dụng ECR + ECS Task Definition
- **Google Cloud Run**: Deploy từ Container Registry
- **Azure Container Instances**: Deploy từ ACR

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker Image
  run: docker build -t datn-api:${{ github.sha }} ./apps/api

- name: Push to Registry
  run: docker push your-registry/datn-api:${{ github.sha }}
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
