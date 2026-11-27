# Next.js frontend. NEXT_PUBLIC_API_URL is baked in at build time. Build from the repo root:
#   docker build -f deploy/web.Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://grid.example.com -t grid-web .
FROM node:20.19-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./

ARG NEXT_PUBLIC_API_URL=http://localhost:8088
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:20.19-alpine

WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000

CMD ["npm", "start"]
