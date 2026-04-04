FROM oven/bun:latest
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./

# Copy all workspace package files to satisfy workspace-aware install
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Now pull in the full source for needed workspaces
COPY shared ./shared
COPY server ./server

# Install dependencies for the whole workspace
RUN bun install

# Expose server port
EXPOSE 3000

# Set working directory to server
WORKDIR /app/server

# Start server
CMD ["bun", "run", "src/index.ts"]
