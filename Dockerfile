#react build
FROM node:22-alpine AS build
WORKDIR /app
COPY client/package*.json client/
RUN cd client && npm ci
COPY . .
RUN cd client && npm run build

#server
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
COPY --from=build /app/client/dist client/dist
EXPOSE 3000
CMD ["node", "index.js"]