# GitHub Actions - Docker Build for API

## 📄 Workflow File

**Location:** [`.github/workflows/docker-build-api.yml`](file:///d:/Do_An/code/.github/workflows/docker-build-api.yml)

---

## 🎯 Trigger Conditions

Workflow sẽ chạy khi:
- **Branch:** Push lên `development`
- **Paths:** Có thay đổi trong:
  - `apps/api/**`
  - `packages/**` (dependencies)
  - `.github/workflows/docker-build-api.yml` (workflow file itself)

---

## 🏗️ Workflow Steps

### 1. **Checkout Repository**
Clone source code từ repository

### 2. **Set up Docker Buildx**
Setup Docker Buildx để build multi-platform images và caching

### 3. **Login to GitHub Container Registry**
Authenticate với `ghcr.io` sử dụng `GITHUB_TOKEN` (tự động có sẵn)

### 4. **Extract Metadata**
Tạo tags và labels cho Docker image:
- `latest` - Tag cho development builds
- `development-<sha>` - Tag với commit SHA

### 5. **Build and Push**
Build Docker image và push lên GitHub Container Registry với:
- **Context:** `./apps/api`
- **Dockerfile:** `./apps/api/Dockerfile`
- **Platform:** `linux/amd64`
- **Cache:** GitHub Actions cache (tăng tốc builds)

---

## 📦 Image Registry

Images được push lên **GitHub Container Registry (GHCR)**:

```
ghcr.io/<username>/<repo>/api:latest
ghcr.io/<username>/<repo>/api:development-<sha>
```

### Pull Image

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull latest development image
docker pull ghcr.io/<username>/<repo>/api:latest

# Pull specific commit
docker pull ghcr.io/<username>/<repo>/api:development-abc1234
```

---

## 🔒 Permissions Required

Workflow cần permissions sau (đã config trong file):
- ✅ `contents: read` - Đọc source code
- ✅ `packages: write` - Push images lên GHCR

---

## 🚀 Usage

### Automatic Build

```bash
# Commit changes
git add .
git commit -m "feat(api): update endpoint"

# Push to development branch
git push origin development

# GitHub Actions sẽ tự động build và push image
```

### View Workflow Status

1. Vào repository trên GitHub
2. Click tab **Actions**
3. Xem workflow **Build and Push API Docker Image**

---

## 🔧 Customization

### Thay Đổi Registry

Để sử dụng Docker Hub thay vì GHCR:

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: <dockerhub-username>/api

# Thay đổi login step
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

### Thêm Multi-Platform Build

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
    # ... other configs
```

### Thêm Notifications

```yaml
- name: Notify on success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ API Docker image built successfully!"}'
```

---

## 🐛 Troubleshooting

### Build Failed

```bash
# Check logs trong GitHub Actions tab
# Common issues:
# 1. Dockerfile syntax error
# 2. Missing dependencies
# 3. Build context issues
```

### Permission Denied

Đảm bảo repository settings:
1. **Settings** → **Actions** → **General**
2. **Workflow permissions** → Select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**

### Image Not Found

```bash
# Verify image exists
gh api /user/packages/container/api/versions

# Make package public (if needed)
# Settings → Packages → Change visibility
```

---

## 📊 Build Cache

Workflow sử dụng GitHub Actions cache để tăng tốc builds:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

**Benefits:**
- ⚡ Faster builds (reuse layers)
- 💰 Reduced build time costs
- 🔄 Incremental builds

---

## 🔐 Security Best Practices

- ✅ Sử dụng `GITHUB_TOKEN` (tự động rotate)
- ✅ Không hardcode credentials
- ✅ Scan images với Trivy/Snyk (có thể thêm)
- ✅ Sign images với Cosign (optional)

### Thêm Security Scan

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

---

## 📝 Next Steps

1. **Push code lên development** để test workflow
2. **Verify image** trong GitHub Packages
3. **Deploy image** từ GHCR:
   ```bash
   docker run -p 3000:3000 ghcr.io/<username>/<repo>/api:latest
   ```
4. **Setup CD pipeline** để auto-deploy khi image mới được push

---

## 🔗 Related Files

- [`Dockerfile`](file:///d:/Do_An/code/apps/api/Dockerfile)
- [`docker-compose.yml`](file:///d:/Do_An/code/apps/api/docker-compose.yml)
- [`README.Docker.md`](file:///d:/Do_An/code/apps/api/README.Docker.md)
