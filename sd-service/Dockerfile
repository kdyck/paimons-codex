# Use Python slim image instead - PyTorch will handle CUDA
FROM python:3.11-slim

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 \
    && pip install --no-cache-dir -r requirements.txt

# Copy the SD service code
COPY . .

# Expose port
EXPOSE 7860

# Run the SD service
CMD ["python", "main.py"]