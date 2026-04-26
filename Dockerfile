# Use the official Bun image
FROM oven/bun:1-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependency files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy application source
COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Run directly with Bun (no build step needed for TypeScript)
CMD ["bun", "run", "src/index.ts"]