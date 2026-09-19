# Dockerfile for TestForge Express REST API & Socket.IO Server
FROM node:18-alpine

WORKDIR /app

# Copy root monorepo manifests & workspaces
COPY package*.json ./
COPY packages/dsl-schema ./packages/dsl-schema
COPY packages/codegen ./packages/codegen
COPY apps/server ./apps/server

# Install dependencies
RUN npm ci

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "apps/server/src/server.js"]
