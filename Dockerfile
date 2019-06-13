FROM node:8.8-alpine

RUN mkdir -p /app
WORKDIR /app

COPY ./ /app/
RUN npm install

EXPOSE 3000
CMD ["node", "examples/tsp/server.js"]

