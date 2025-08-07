FROM python:3.11

WORKDIR /backend

# Install curl (and clean up apt cache to keep image small)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend ./backend

# Copy secrets into place if they exist
# (don't fail if secrets aren't set in local dev)
RUN mkdir -p /backend && \
    if [ -f /etc/secrets/render-env ]; then cp /etc/secrets/render-env /backend/.env; fi && \
    if [ -f /etc/secrets/gDriver.json ]; then cp /etc/secrets/gDriver.json /backend/gDriver.json; fi


CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"]
