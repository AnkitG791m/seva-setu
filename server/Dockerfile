FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate --schema ./prisma/schema.prisma

# Copy source
COPY src ./src

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PORT=8080
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/sevasetu.db"

EXPOSE 8080

# Push DB schema and start server
CMD npx prisma db push --schema ./prisma/schema.prisma --skip-generate && node src/index.js
