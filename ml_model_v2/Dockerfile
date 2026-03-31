# Use PyTorch with CPU support for efficiency (or CUDA if GPU is available)
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements or install directly to save time if we know them
# Based on the imports in app.py
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    torch \
    pandas \
    numpy \
    joblib \
    scikit-learn

# Copy the entire ml_model_v2 directory
COPY . .

# Expose the Flask port
EXPOSE 8001

# Run the inference server
# We use the full path to app.py
CMD ["python", "api/app.py"]
