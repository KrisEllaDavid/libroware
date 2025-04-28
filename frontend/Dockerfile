FROM node:20-slim as build

WORKDIR /app

COPY package*.json ./

RUN npm ci
RUN npm install cssnano --save-dev

COPY . .

# Create a minimal tsconfig for the build
RUN echo '{"compilerOptions":{"moduleResolution":"node","target":"ES2020","useDefineForClassFields":true,"lib":["ES2020","DOM","DOM.Iterable"],"module":"ESNext","skipLibCheck":true,"noEmit":true,"jsx":"react-jsx"},"include":["src"]}' > tsconfig.build.json

# Use the simplified config for building
RUN npx vite build

# Production stage
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Add nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 