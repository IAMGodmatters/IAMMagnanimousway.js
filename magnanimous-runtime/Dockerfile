FROM node:24-bookworm-slim AS frontend-builder
WORKDIR /app
COPY . .
RUN cd frontend && npm ci && npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY . .
COPY --from=frontend-builder /app/frontend/out /app/frontend/out
RUN mkdir -p /app/data /app/backups \
  && node magnanimous-runtime/scripts/verify-runtime.mjs \
  && node magnanimous-runtime/scripts/verify-cloud-control.mjs
EXPOSE 8788
CMD ["node","magnanimous-runtime/src/server.mjs"]
