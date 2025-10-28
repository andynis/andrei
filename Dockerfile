FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY config/ ./config/
COPY .env.example .env.example

# Create necessary directories
RUN mkdir -p logs temp

# Set environment
ENV PYTHONUNBUFFERED=1

# Default command (can be overridden)
CMD ["python", "src/main.py", "--mode", "schedule"]
