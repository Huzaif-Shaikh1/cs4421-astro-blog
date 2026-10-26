# ---------- Stage 1: build ----------
FROM node:24-slim AS builder
WORKDIR /app

# Copy only the dependency files first, so this layer is cached
# and npm ci only re-runs when dependencies change
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the rest of the source code and build the site
COPY . .
RUN npm run build

# ---------- Stage 2: run ----------
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321

# Install only the packages needed at runtime (no dev tools like eslint or vitest)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the built site from the builder stage
COPY --from=builder /app/dist ./dist

# Run as the non-root "node" user that the base image provides
USER node

EXPOSE 4321

# Docker checks /api/health every 30s; 3 failures in a row = unhealthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4321/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "./dist/server/entry.mjs"]