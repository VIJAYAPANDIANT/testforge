# Dockerfile for Standalone Playwright Execution Worker
FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# Copy root monorepo manifests & workspaces
COPY package*.json ./
COPY packages/dsl-schema ./packages/dsl-schema
COPY packages/codegen ./packages/codegen
COPY apps/worker ./apps/worker

# Install workspace dependencies
RUN npm ci

# Ensure upload directory exists for failure screenshots
RUN mkdir -p /app/apps/worker/uploads/screenshots && chmod -R 777 /app/apps/worker/uploads

ENV NODE_ENV=production

CMD ["node", "apps/worker/src/cli.js"]
