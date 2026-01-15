# S3-Compatible Storage Setup Guide

Hệ thống hỗ trợ nhiều S3-compatible storage providers. Dưới đây là hướng dẫn cấu hình cho từng provider.

## AWS S3

```env
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
# S3_ENDPOINT= (leave empty for AWS S3)
# AWS_S3_PUBLIC_URL= (optional, for CloudFront CDN)
```

## Backblaze B2

1. Tạo bucket tại [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Tạo Application Key với quyền read/write
3. Cấu hình:

```env
AWS_REGION=us-west-004
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_application_key
AWS_S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
# AWS_S3_PUBLIC_URL=https://f004.backblazeb2.com/file/your-bucket-name (optional)
```

**Note:** Region phải match với endpoint region (e.g., us-west-004)

## Cloudflare R2

1. Tạo R2 bucket tại [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Tạo API Token với quyền R2 Read & Write
3. Cấu hình:

```env
AWS_REGION=auto
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
# AWS_S3_PUBLIC_URL=https://your-custom-domain.com (optional, if using custom domain)
```

**Note:** 
- Account ID có thể tìm trong Cloudflare Dashboard
- R2 không charge egress fees
- Có thể setup custom domain cho public access

## MinIO (Self-hosted)

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT=http://localhost:9000
AWS_S3_PUBLIC_URL=http://localhost:9000/your-bucket-name
```

## Bucket Permissions

Để files có thể public access, cần cấu hình bucket policy:

### AWS S3 Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Backblaze B2
- Set bucket to "Public" trong bucket settings
- Hoặc sử dụng bucket authorization rules

### Cloudflare R2
- Enable "Public Access" trong R2 bucket settings
- Hoặc setup custom domain với public access

## Testing

Test connection với curl:
```bash
# Upload test
curl -X POST http://localhost:3000/v1/users/avatar/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"

# Verify URL works
curl -I <returned-avatar-url>
```

## Troubleshooting

**Error: "Access Denied"**
- Check bucket permissions/policy
- Verify access key có quyền read/write

**Error: "Invalid endpoint"**
- Verify S3_ENDPOINT format (phải có https://)
- Check region matches endpoint

**Error: "Bucket not found"**
- Verify bucket name đúng
- Check bucket tồn tại trong account

**Images không load**
- Verify AWS_S3_PUBLIC_URL đúng
- Check CORS settings nếu access từ browser
- Verify bucket public access enabled
