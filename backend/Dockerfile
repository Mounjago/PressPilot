# PressPilot Backend - Multi-stage Dockerfile
# Stage 1: base (shared dependencies)
# Stage 2: dev (with devDependencies + nodemon)
# Stage 3: production (optimized, non-root)

# ============================================
# STAGE 1 - Base
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# System deps for native modules (bcrypt, etc.)
RUN apk add --no-cache dumb-init

# Copy package files for layer caching
COPY package.json package-lock.json* ./

# ============================================
# STAGE 2 - Development
# ============================================
FROM base AS dev

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p uploads/attachments uploads/audio uploads/avatars uploads/covers uploads/documents logs

EXPOSE 3001

CMD ["npx", "nodemon", "server.js"]

# ============================================
# STAGE 3 - Production
# ============================================
FROM base AS production

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p uploads/attachments uploads/audio uploads/avatars uploads/covers uploads/documents logs

# Create non-root user
RUN addgroup -g 1001 -S presspilot && \
    adduser -S presspilot -u 1001 -G presspilot

# Own the app directory
RUN chown -R presspilot:presspilot /app

USER presspilot

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use dumb-init to handle PID 1 properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
