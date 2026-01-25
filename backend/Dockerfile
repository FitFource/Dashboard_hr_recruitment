# =========================
# Build stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# =========================
# Production stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Install prod dependencies AS ROOT
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist

# Create non-root user AFTER install
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app

USER app

EXPOSE 3000
CMD ["node", "dist/server.js"]