FROM python:3.11-slim

# Install system dependencies (ffmpeg, libreoffice, pandoc, redis-tools)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libreoffice \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create temp directory
RUN mkdir -p temp_downloads

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
