# Build stage
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./
COPY shared ./shared
COPY client ./client

# Install dependencies for the whole workspace
RUN bun install

# Build the client
WORKDIR /app/client
RUN bun run build

# Runtime stage (Using Bun instead of Nginx)
FROM oven/bun:latest AS runner
WORKDIR /app

# Copy built workspace files from builder
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client ./client

# Install production dependencies
RUN bun install

# Expose Vite preview port
EXPOSE 80

# Start Vite preview server
WORKDIR /app/client
CMD ["bun", "x", "vite", "preview", "--host", "0.0.0.0", "--port", "80"]
