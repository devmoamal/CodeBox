FROM oven/bun:latest
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
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
COPY server ./server

# Expose server port
EXPOSE 3000

# Set working directory to server
WORKDIR /app/server

# Start server using package.json script
CMD ["bun", "run", "start"]
