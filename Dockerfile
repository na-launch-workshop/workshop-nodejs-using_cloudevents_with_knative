FROM registry.access.redhat.com/ubi9/nodejs-18

WORKDIR /opt/app-root/src

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY .env.example ./

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

USER 1001

CMD ["npm", "start"]
