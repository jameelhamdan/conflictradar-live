# Build-only stage — output lives at /app/dist/public
# Production: nginx/Dockerfile uses this as a multi-stage source (build context: project root)
# Local dev: waku dev (npm run dev)
FROM node:25-alpine AS build
ARG VITE_DOMAIN
ENV VITE_DOMAIN=${VITE_DOMAIN}
ARG VITE_GA_ID
ENV VITE_GA_ID=${VITE_GA_ID}
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
