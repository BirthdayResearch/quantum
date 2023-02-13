# Dockerfile used to build an image for the bridge-api
FROM node:18-alpine
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm install -g pnpm
RUN pnpm config set auto-install-peers true

RUN apk --no-cache add curl git
RUN apk add --no-cache --virtual .gyp python3 make g++

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=false
ENV CYPRESS_INSTALL_BINARY=0

COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY .npmrc ./

COPY apps ./apps
COPY packages ./packages

RUN pnpm fetch

RUN pnpm install -r --offline
RUN pnpm build --filter="./apps/server"

CMD node
