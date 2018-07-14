FROM node:8

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm Install

COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]