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
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=@crm/web"]

FROM dependencies AS build
COPY . .
RUN npm run build --workspace=@crm/web

FROM node:24-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build --chown=appuser:appgroup /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /workspace/apps/web/.next/static ./apps/web/.next/static
USER appuser
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
