FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY . .
RUN mkdir -p /app/data && node magnanimous-runtime/scripts/verify-runtime.mjs
EXPOSE 8788
VOLUME ["/app/data"]
CMD ["node","magnanimous-runtime/src/server.mjs"]
