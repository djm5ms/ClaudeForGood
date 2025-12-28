FROM node:18-alpine

WORKDIR /app

COPY package.json pack-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

