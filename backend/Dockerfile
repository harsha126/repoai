# --- Stage 1: build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# If you use pnpm/yarn, adjust accordingly
RUN npm install

COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript -> JS (assumes "build" script)
RUN npm run build

# --- Stage 2: runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy needed files
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# optional: little entry script to run migrations then start server
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000

CMD ["./docker-entrypoint.sh"]
