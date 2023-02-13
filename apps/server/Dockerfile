# Dockerfile used to build an image for the bridge-api
FROM node:18-alpine
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm install -g pnpm
RUN pnpm config set auto-install-peers true

RUN apk --no-cache add curl git
RUN apk add --no-cache --virtual .gyp python3 make g++
# See: https://github.com/vercel/turbo/issues/2198#issuecomment-1276475618
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=false
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY .npmrc ./

COPY apps ./apps
COPY packages ./packages

RUN pnpm install
RUN pnpm build --filter="server"

CMD node bridge-api
