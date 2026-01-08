#!/bin/bash
set -e

echo "🚀 Starting Deployment based on GUIA_DESPLIEGUE.md"

# 1. Build Frontend Locally
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Upload Artifacts
echo "📤 Uploading frontend/dist to VPS..."
# Using tar for cleaner transfer as suggested in walkthrough/guide possibilities, 
# but sticking to strict guide command:
scp -o BatchMode=yes -r frontend/dist root@srv1135658.hstgr.cloud:/opt/siac_voz/frontend/

# 3. Deploy on VPS
echo "🔄 Connecting to VPS to restart services..."
# Using reset --hard to ensure server matches repo and overwrites any untracked conflicting files
ssh root@srv1135658.hstgr.cloud "cd /opt/siac_voz && git fetch origin main && git reset --hard origin/main && docker compose build && docker compose up -d"

echo "✅ Deployment Complete!"
