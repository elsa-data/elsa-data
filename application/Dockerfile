
#
# Sources Nodejs binaries without having to package install them (ok as long as both images shared common Slim base)
# Also install the specific EdgeDb packages we use
# Note unlike the edgedb builder, we have a functional npm which is why we do this here
# Based on techniques from https://discord.com/channels/841451783728529451/955887885557579788/955946426322522153
#
FROM node:18-slim AS node-deps

WORKDIR /build

COPY backend/package.json package.json
RUN echo '{ \
    "dependencies": {' $(grep -E -o '"edgedb":\s"(.*)"' package.json) '}, \
    "devDependencies": {' $(grep -E -o '"@edgedb/generate":\s"(.*)"' package.json) '} \
    }' > package.json && npm install

#
# Database builder to create all generated files that require the install database
#
FROM edgedb/edgedb:2.8 AS edgedb-builder

# bring in the compatible node binary
COPY --from=node-deps /usr/local/bin/node /usr/local/bin/node

# setup a /build that edgedb can work in
RUN mkdir /build && chown edgedb:edgedb /build
USER edgedb
WORKDIR /build

# bring in node_modules with our installed packages
COPY --from=node-deps /build .

# edgedb needs the dbschema folder which has the schemas/migrations
COPY ./backend/dbschema/ dbschema/

# NOTE: the & and && here has some pretty subtle interaction - be careful working on this
RUN edgedb-server \
    -D /build/data \
    --security insecure_dev_mode \
    --runstate-dir /build/runstate \
    & edgedb migration apply \
    -H localhost \
    --tls-security insecure \
    --wait-until-available 2m \
    && mkdir generated \
    && cd generated \
    && node ../node_modules/.bin/generate edgeql-js \
    -H localhost \
    --target ts \
    --tls-security insecure \
    --out edgeql-js \
    && node ../node_modules/.bin/generate interfaces \
    -H localhost \
    --tls-security insecure \
    --file interfaces.ts \
    && node ../node_modules/.bin/generate queries \
    --file queries \
    -H localhost \
    --target ts \
    --tls-security insecure \
    && ls -alRt


#
# Deployed app
#
FROM amazonlinux:2022

WORKDIR /app

RUN dnf install -y nodejs npm findutils shadow util-linux

# TODO: Discard the useless stuff using a multi-stage build
COPY . .

RUN cd backend && npm ci
RUN cd frontend && npm ci
RUN cd common/elsa-constants && npm ci
RUN cd common/elsa-types && npm ci

COPY --from=edgedb-builder /build/generated/ ./backend/dbschema/

RUN ls -alRt backend/dbschema

# we use a matching CLI binary from our builder - and keep it for some admin level activity (migrations etc)
COPY --from=edgedb-builder /usr/bin/edgedb ./backend/

# add in an extra compile step - which whilst not needed for runtime, does help keep
# crazy errors away (ts-node does not actually do type checking)
RUN : \
  && cd backend && npx tsc --noEmit

RUN : \
  && cd frontend \
  && npm run build:prod

# we want to embed into the image environment immutable tags passed in by the build environment

# this is the 'semantic' version as set by developers i.e. 1.0.3
ARG ELSA_DATA_VERSION
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_VERSION:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_VERSION $ELSA_DATA_VERSION

# this is the literal timestamp of building
ARG ELSA_DATA_BUILT
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_BUILT:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_BUILT $ELSA_DATA_BUILT

# this is the github revision tag that precisely indicates the commit trigger
ARG ELSA_DATA_REVISION
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_REVISION:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_REVISION $ELSA_DATA_REVISION

EXPOSE 80

WORKDIR /app/backend

# NOTE: a feature of using node directly as the entrypoint is that container signal handling
# correctly passes SIGTERM to the Fastify server which can then shut down gracefully
ENTRYPOINT [ "node", "--loader", "ts-node/esm", "src/entrypoint.ts" ]

# TODO: careful crafting has broken stuff.. for the moment just throwing everything together
# TODO: decide if anything below is useful and if not delete

#COPY backend/src/favicon.ico ./
# we carefully craft the runtime structure from bits and pieces of the build
#COPY --from=backend-builder /build/common/ /common/
# bring in any node_modules incompatible with bundling
#COPY --from=backend-builder /build/backend/node_modules/node-gyp-build/ ./node_modules/node-gyp-build/
#COPY --from=backend-builder /build/backend/node_modules/sodium-native/ ./node_modules/sodium-native/
#COPY --from=backend-builder /build/backend/node_modules/ ./node_modules/
# the configurations and translations
#COPY --from=backend-builder /build/backend/config/ ./config/
#COPY --from=backend-builder /build/backend/locales/ ./locales/
# aargs
#COPY --from=backend-builder /build/backend/dbschema/ ./dbschema/
#COPY --from=backend-builder /build/backend/jobs/ ./jobs/
#COPY --from=backend-builder /build/backend/src/ ./src/
#COPY --from=backend-builder /build/backend/package.json ./
#COPY --from=backend-builder /build/backend/tsconfig.json ./
# the react front end bundled into a dist directory
#COPY --from=backend-builder /build/frontend/build ./client/dist/
# each Bree job gets built/bundled as a standalone
#COPY --from=backend-builder /build/backend/*-job.js ./
# the main elsa app bundled
#COPY --from=backend-builder /build/backend/elsa.cjs ./

#
# We use a single builder for both frontend and backend as they share
# some common code and setup
#
#FROM amazonlinux:2022 AS backend-builder

#RUN dnf install -y nodejs npm

#WORKDIR /build

# the common packages need to be already in place in the folder struct *before* npm install
#COPY common/ ./common/

# install packages for backend and frontend
#COPY backend/package* ./backend/
#RUN cd backend && npm clean-install
#COPY frontend/package* ./frontend/
#RUN cd frontend && npm clean-install

# create the react app
# (frontend build is *way* slower than backend so we do this first to hopefully docker cache)
#COPY frontend/ ./frontend/
#RUN cd frontend && npx react-scripts build

# copy the entire backend structure as the bundler uses it all
#COPY backend/ ./backend/

# NOTE: we currently exclude from bundling
#   sodium-native and node-gyp-build - these don't get bundled well because they include native libs etc
#RUN cd backend && npx esbuild src/entrypoint-container.ts --bundle --external:sodium-native --external:node-gyp-build --platform=node --target=node18 --outfile=./elsa.cjs

# we also bundle each Bree job as an individual bundle
#RUN cd backend && npx esbuild jobs/entrypoint-job-handler.ts --bundle --platform=node --target=node18 --outfile=./select-job.js

# ENTRYPOINT [ "node", "elsa.cjs" ]
