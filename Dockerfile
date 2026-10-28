# Build do backend NestJS e do Prisma
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Prisma precisa de OpenSSL no ambiente Debian
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Runtime de producao
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Mantemos a CLI do Prisma disponivel para "prisma migrate deploy"
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/package-lock.json ./package-lock.json

ENV NODE_ENV=production
ENV PORT=3333

USER node
EXPOSE 3333

CMD ["npm", "run", "start:prod"]
