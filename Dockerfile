FROM node:20.14-alpine


RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY .npmrc .

RUN --mount=type=secret,id=NPM_TASKFORCESH_TOKEN \
    NPM_TASKFORCESH_TOKEN=$(cat /run/secrets/NPM_TASKFORCESH_TOKEN) \
    npm install && npm install -g nodemon

WORKDIR /app
COPY src src