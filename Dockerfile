FROM docker.io/oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY *.ts ./

RUN chown -R bun:bun /app
USER bun

CMD ["bun", "run", "index.ts"]
