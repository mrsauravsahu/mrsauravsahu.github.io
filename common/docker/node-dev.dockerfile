ARG NODE_VERSION

FROM node:${NODE_VERSION}-alpine

WORKDIR /app

EXPOSE 80
