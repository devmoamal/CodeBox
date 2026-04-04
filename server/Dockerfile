FROM oven/bun:latest
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./
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
