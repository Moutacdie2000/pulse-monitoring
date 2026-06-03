# Image de production Next.js (Pulse).
FROM node:20-bookworm-slim AS base
WORKDIR /app
# openssl est requis par les moteurs Prisma.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Applique le schéma (crée les tables) puis démarre le serveur.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start"]
