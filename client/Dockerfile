# Build stage
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./

# Copy all workspace package files to satisfy workspace-aware install
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install dependencies for the whole workspace
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Now pull in the full source for needed workspaces
COPY shared ./shared
COPY client ./client

# Build the client
WORKDIR /app/client
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN bun run build

# Runtime stage (Using Bun instead of Nginx)
FROM oven/bun:latest AS runner
WORKDIR /app

# Copy built workspace files from builder
COPY --from=builder /app/package.json /app/bun.lock ./

# Again, satisfy workspace graph for production install
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/client/package.json ./client/package.json

# Install production dependencies
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy source only for relevant workspaces
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client ./client

# Expose Vite preview port
EXPOSE 80

# Start Vite preview server
WORKDIR /app/client
CMD ["bun", "x", "vite", "preview", "--host", "0.0.0.0", "--port", "80"]
