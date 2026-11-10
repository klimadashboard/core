# Node is pinned to an exact patch release so security updates are explicit.
# Bump both FROM lines together.
FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app

# Dependencies go in their own layer, before anything that varies: as long as
# package-lock.json is unchanged this comes straight from the build cache.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# $env/static/* imports are inlined at build time, so these must be present
# during `vite build`. Coolify passes build-time variables as build args.
#
# They are declared here and not at the top of the stage on purpose: an ARG in
# scope is part of the cache key of every RUN that follows it, and the three
# sites (AT/DE/ORG) build the same commit with different values. Declared
# earlier, each site would get its own `npm ci` instead of sharing one.
ARG API_URL
ARG BREVO_API_KEY
ARG BREVO_DOI_REDIRECT_URL
ARG BREVO_DOI_TEMPLATE_ID
ARG CAMP_API_KEY
ARG CAMP_MANDATE_ID
ARG CAMP_ORG_ID
ARG DIRECTUS_TOKEN
ARG PUBLIC_CARTO_API_KEY
ARG PUBLIC_MAPBOX_TOKEN
ARG PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG PUBLIC_VERSION
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET

# Cap the heap so several builds running at once cannot collectively
# overcommit the box. Left to itself Node sizes the old space from total
# RAM, and three concurrent builds drove this machine into swap and an
# OOM kill. Set after `npm ci` on purpose, so that layer stays cached.
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build && npm prune --omit=dev

# Runtime stage carries no build args; runtime env comes from Coolify.
FROM node:24.22.1-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "build"]
