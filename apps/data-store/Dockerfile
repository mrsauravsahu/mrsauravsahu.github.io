ARG NODE_VERSION
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY ./*.json ./

RUN npm ci --development

COPY ./index.ts ./index.ts

RUN npm run build

FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY ./package*.json ./

RUN npm ci --prod

COPY ./data ./data
COPY --from=build /app/dist .

EXPOSE 80

CMD node .