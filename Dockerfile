FROM node:16-slim
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
