FROM node:20-bookworm-slim

# better-sqlite3 is a native module — these tools let it compile
# during npm install if no ready-made binary matches this system.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/app.js"]
