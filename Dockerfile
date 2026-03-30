# PressPilot Frontend - Multi-stage Dockerfile
# Stage 1: Build (Node + Vite)
# Stage 2: Serve (nginx, production-optimized)

# ============================================
# STAGE 1 - Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for Vite env variables
ARG VITE_API_URL=""
ARG VITE_CLOUDINARY_CLOUD_NAME=presspilot
ARG VITE_CLOUDINARY_UPLOAD_PRESET=ml_default

# Build the frontend
RUN npm run build

# ============================================
# STAGE 2 - Production (nginx)
# ============================================
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template (uses ${BACKEND_URL} variable)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Default backend URL (overridden by Railway env var)
ENV BACKEND_URL=http://backend:3001

# Non-root-friendly permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# envsubst replaces ${BACKEND_URL} in nginx template then starts nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
