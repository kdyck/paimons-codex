FROM oraclelinux:9-slim

WORKDIR /app

# Install Python 3.11 and system dependencies using microdnf
RUN microdnf update -y && \
    microdnf install -y \
    python3.11 \
    python3.11-pip \
    wget \
    unzip \
    libaio \
    && microdnf clean all

# Install Oracle Instant Client
RUN mkdir -p /opt/oracle \
    && wget -q https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && unzip -q instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && ls -la \
    && mv instantclient_*_* /opt/oracle/instantclient_21_13 \
    && rm instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && ls -la /opt/oracle/

# Set environment variables for Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_13:$LD_LIBRARY_PATH
ENV PATH=/opt/oracle/instantclient_21_13:$PATH

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN python3.11 -m pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .


# Expose port
EXPOSE 8000

# Command to run the application
CMD ["python3.11", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]