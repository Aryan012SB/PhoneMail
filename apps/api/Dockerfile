FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY apps/api ./apps/api
COPY prisma ./prisma

RUN npx prisma generate --schema=./prisma/schema.prisma

WORKDIR /app/apps/api
RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --schema=../../prisma/schema.prisma && npx tsx ../../prisma/seed.ts && node dist/index.js"]
