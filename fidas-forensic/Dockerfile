FROM python:3.12-slim

# Disable Python output buffering so print() statements appear
# immediately in Render's logs instead of being silently held back
ENV PYTHONUNBUFFERED=1

# Install system dependencies: ExifTool, Tesseract OCR, Poppler (for PDF conversion)
RUN apt-get update && apt-get install -y \
    libimage-exiftool-perl \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000

CMD gunicorn --bind 0.0.0.0:$PORT --timeout 120 --workers 1 --access-logfile - --error-logfile - app:app