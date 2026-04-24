# Multi-stage build for Knowall. One container serves frontend + API.
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Backend deps + source
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Built frontend into backend/public (matches what src/index.js expects)
COPY --from=frontend /app/frontend/dist ./backend/public

# Writable uploads dir — empty by default. Mount a volume here for persistence.
RUN mkdir -p /app/backend/uploads

EXPOSE 4000
WORKDIR /app/backend
CMD ["node", "src/index.js"]
