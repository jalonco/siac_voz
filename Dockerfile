# --- Stage 1: Build Frontend ---
FROM node:18-alpine as builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: Run Backend ---
FROM python:3.10-slim

WORKDIR /app

# Install audio dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    portaudio19-dev \
    libsndfile1 \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY . .

# Copy Built Frontend from Stage 1
# We place it in /app/static (or wherever main.py expects it)
COPY --from=builder /app/frontend/dist /app/static

ENV PORT=8765
EXPOSE 8765

CMD ["python", "main.py"]
