FROM node:20-alpine

WORKDIR /app

# Install bash and docker CLI
RUN apk add --no-cache bash docker-cli git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application files
COPY index.js ./

# Create non-root user
RUN addgroup -g 1001 webhook && \
    adduser -D -u 1001 -G webhook webhook

# Note: We need root access to run docker commands
# So we'll run as root but be careful with permissions

EXPOSE 9000

CMD ["node", "index.js"]
