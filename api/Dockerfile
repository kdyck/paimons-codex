# Multi-stage build for smaller final image
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    gcc \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Install Oracle Instant Client
RUN mkdir -p /opt/oracle \
    && cd /tmp \
    && wget -q https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && unzip -q instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && mv instantclient_* /opt/oracle/instantclient_21_13 \
    && rm instantclient-basic-linux.x64-21.13.0.0.0dbru.zip

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage - runtime
FROM python:3.11-slim

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    libaio1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Oracle Instant Client from builder
COPY --from=builder /opt/oracle /opt/oracle

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Set environment variables for Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_13:$LD_LIBRARY_PATH
ENV PATH=/opt/oracle/instantclient_21_13:/root/.local/bin:$PATH
ENV ORACLE_LIB_DIR=/opt/oracle/instantclient_21_13

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]