FROM node:16.17.0-alpine

COPY ./ /opt/quiz/

WORKDIR /opt/quiz/client
RUN npm ci && npm build

WORKDIR /opt/quiz
RUN npm ci

EXPOSE 3000

ENV NODE_ENV production
ENV PORT 3000
ENV REDIS_HOST localhost
ENV REDIS_PORT 6379

ENTRYPOINT ["npm","run","prod"]