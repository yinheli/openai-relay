FROM docker.io/denoland/deno:debian-2.2.4
WORKDIR /app
COPY . .
RUN deno install
CMD ["deno", "run", "-A", "index.ts"]
