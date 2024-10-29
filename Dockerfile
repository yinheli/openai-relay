FROM --platform=$BUILDPLATFORM oven/bun:1.1-debian
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
CMD ["bun", "index.ts"]
