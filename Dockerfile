FROM python:3.11

WORKDIR /backend

# Install curl (and clean up apt cache to keep image small)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend ./backend

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"]
