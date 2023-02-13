# Dockerfile used to build an image for the bridge-api
FROM node:18-alpine
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm install -g pnpm
RUN pnpm config set auto-install-peers true

RUN apk --no-cache add curl git

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=false
ENV CYPRESS_INSTALL_BINARY=0

COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY .npmrc ./

COPY apps/server ./apps/server

RUN pnpm fetch --prod

RUN pnpm install -r --offline --prod
RUN pnpm build --filter="server"

CMD node
