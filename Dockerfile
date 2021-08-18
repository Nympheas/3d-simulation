FROM node:14-alpine

# Install backend dependencies
WORKDIR /usr/src/mavlink
COPY . .
RUN npm install

# Install frontend dependencies
WORKDIR /usr/src/mavlink/frontend
RUN npm install

# Build the whole project
WORKDIR /usr/src/mavlink/
RUN npm run build

EXPOSE 8080
EXPOSE 8081

STOPSIGNAL SIGINT

CMD [ "node", "build/index.js" ]