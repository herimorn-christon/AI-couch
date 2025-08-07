FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create uploads directory
RUN mkdir -p uploads/videos uploads/images

EXPOSE 3000

CMD ["npm", "start"]