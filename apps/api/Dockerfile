FROM node:24-alpine AS dependencies
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=@crm/api"]

FROM dependencies AS build
COPY . .
RUN npm run db:generate --workspace=@crm/api && npm run build --workspace=@crm/api

FROM node:24-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build --chown=appuser:appgroup /workspace/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=appuser:appgroup /workspace/apps/api/package.json ./apps/api/package.json
USER appuser
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
