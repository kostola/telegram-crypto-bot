FROM node:carbon
WORKDIR /usr/src/app
COPY package.json .
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD [ "npm", "start" ]
