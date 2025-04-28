FROM node:20-slim

# Install OpenSSL - this is required for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "start"] 