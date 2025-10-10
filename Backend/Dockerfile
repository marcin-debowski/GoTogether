FROM node:22-alpine

WORKDIR /app/backend

COPY package*.json ./

RUN npm install

COPY . .

ENV dotenv_config_path=/app/backend/.env

EXPOSE 4000

CMD ["npm", "run", "dev"]