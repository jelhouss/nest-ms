# base
FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app

# builder 
FROM base AS builder

ENV NODE_ENV=development

COPY package*.json ./
COPY prisma ./prisma/

RUN pnpm install

COPY . .

RUN pnpm run build

# development stage 
FROM builder AS development

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma