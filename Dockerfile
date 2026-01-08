# --- Production Build ---
# As per GUIA_DESPLIEGUE.md, we do NOT build frontend here.
# It uses the 'frontend/dist' folder uploaded via SCP.

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

# Copy Built Frontend (Assumes it exists locally/uploaded)
# We copy it to where main.py expects it (variable static mounting)
# Note: In production, we might mount this as a volume, but COPY is safer for image portability.
COPY frontend/dist /app/frontend/dist

ENV PORT=8765
EXPOSE 8765

CMD ["python", "main.py"]
