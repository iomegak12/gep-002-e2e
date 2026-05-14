FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_AUTH_URL=/iam
ARG VITE_SUPPLIER_URL=/supplier
ARG VITE_PO_URL=/po
ARG VITE_FARO_URL=/collect
ARG VITE_APP_ENV=dev
ARG VITE_APP_VERSION=0.1.0
ENV VITE_AUTH_URL=$VITE_AUTH_URL \
    VITE_SUPPLIER_URL=$VITE_SUPPLIER_URL \
    VITE_PO_URL=$VITE_PO_URL \
    VITE_FARO_URL=$VITE_FARO_URL \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_APP_VERSION=$VITE_APP_VERSION

COPY package.json package-lock.json* ./
# Use `npm install` (not `npm ci`) so the build is resilient to lockfile drift
# after dependency changes. `npm ci` requires lockfile to be in sync; if you
# want strict CI semantics, run `npm install` locally to refresh the lockfile,
# commit it, and switch this back to `npm ci`.
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
