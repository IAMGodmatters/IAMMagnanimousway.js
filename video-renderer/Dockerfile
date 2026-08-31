FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY worker/video-renderer/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY worker/video-renderer/server.py ./server.py
ENV PYTHONUNBUFFERED=1
ENV PORT=10000
EXPOSE 10000
CMD ["sh","-c","uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}"]
