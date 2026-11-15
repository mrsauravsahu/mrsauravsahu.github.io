ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS build-env
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Use npm install instead of npm ci to handle missing lock file
RUN npm install --production=false

COPY . .

RUN npm run build

FROM node:${NODE_VERSION}-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --production=true

COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/node_modules /app/node_modules

EXPOSE 80

ENV HOST=0.0.0.0
ENV PORT=80

ENTRYPOINT node /app/build/index.js
