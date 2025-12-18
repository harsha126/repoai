# --- Stage 1: build ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# For Vite: npm run build (and outputs to dist/)
# For CRA: npm run build (outputs to build/)
RUN npm run build

# --- Stage 2: serve static files ---
FROM node:20-alpine AS runner

WORKDIR /app

# super simple static file server (or use serve / http-server)
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist  
# if using Vite
# or: COPY --from=builder /app/build ./build

EXPOSE 3000

# For Vite build:
CMD ["serve", "-s", "dist", "-l", "3000"]
# For CRA: change "dist" → "build"
