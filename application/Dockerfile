
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
FROM edgedb/edgedb:2.13 AS edgedb-builder

# bring in the compatible node binary
COPY --from=node-deps /usr/local/bin/node /usr/local/bin/node

# setup a /build that edgedb can work in
RUN mkdir /build && chown edgedb:edgedb /build
USER edgedb
WORKDIR /build

# bring in node_modules with our installed packages
COPY --from=node-deps /build .

# edgedb needs the dbschema folder which has the schemas/migrations/queries
COPY --chown=edgedb ./backend/dbschema/ dbschema/

# NOTE: the & and && here has some pretty subtle interaction - be careful working on this
# NOTE: the deliberate absence of .ts on the queries generated 'file' (is auto added by generate)
RUN edgedb-server \
    -D /build/data \
    --security insecure_dev_mode \
    --runstate-dir /build/runstate \
    & edgedb migration apply \
    -H localhost \
    --tls-security insecure \
    --wait-until-available 2m \
    && cd /build/dbschema \
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
    --tls-security insecure

#
# Application builder bundles the frontend and backend
#
FROM node:18 AS app-builder

WORKDIR /build

# this doesn't affect the image size - but does affect the time taken to build - possibly
# can fix - we don't use Docker in dev though so maybe it doesn't really matter
COPY . .

RUN cd backend && npm ci
RUN cd frontend && npm ci
RUN cd common/elsa-constants && npm ci
RUN cd common/elsa-types && npm ci

# pick out the edgedb source artifacts we need to build Elsa Data
COPY --from=edgedb-builder /build/dbschema/edgeql-js/ ./backend/dbschema/edgeql-js/
COPY --from=edgedb-builder /build/dbschema/interfaces.ts ./backend/dbschema/
COPY --from=edgedb-builder /build/dbschema/queries.ts ./backend/dbschema/

# add in an extra compile step - which whilst not needed for runtime does help keep
# crazy errors away (ts-node/esbuild does not actually do type checking)
RUN : \
  && cd backend && npx tsc --noEmit

RUN : \
  && cd frontend \
  && npm run build:prod

RUN cd backend && node bundle-build.js


#
# Deployed Elsa Data application
#
# No building actually done in this image to hopefully minimise size
#
# NOTE we use binaries here that are sourced directly from the edgedb image
# https://github.com/edgedb/edgedb-docker/blob/master/Dockerfile
# so our choice of FROM image is somewhat constrained to something vaguelly compatible
#
FROM node:18-buster-slim

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

WORKDIR /a

# we use a matching CLI binary from our builder - and keep it for some admin level activity (migrations etc)
# NOTE this is a path that is just referred to in some of the entrypoint - so this is just expected to exist for
# some things to function
# TODO add a startup check the make sure it does exist
COPY --from=edgedb-builder /usr/bin/edgedb /a/

# bring in needed configs and migrations
# NOTE these need to be relative to the current directory of where node launches from (not relative to entrypoint src)
COPY --from=edgedb-builder /build/dbschema/migrations/ /a/dbschema/migrations/
COPY --from=app-builder /build/backend/config/ /a/config/
COPY --from=app-builder /build/backend/locales/ /a/locales/

# bring in any node_modules incompatible with bundling (including dependencies of these modules too)
COPY --from=app-builder /build/backend/node_modules/node-gyp-build/ /a/node_modules/node-gyp-build/
COPY --from=app-builder /build/backend/node_modules/sodium-native/ /a/node_modules/sodium-native/
COPY --from=app-builder /build/backend/node_modules/jsonpath/ /a/node_modules/jsonpath/
# these are recursive dependencies of jsonpath - that itself can't be bundled
COPY --from=app-builder /build/backend/node_modules/static-eval/ /a/node_modules/static-eval/
COPY --from=app-builder /build/backend/node_modules/escodegen/ /a/node_modules/escodegen/
COPY --from=app-builder /build/backend/node_modules/esutils/ /a/node_modules/esutils/
COPY --from=app-builder /build/backend/node_modules/esprima/ /a/node_modules/esprima/
COPY --from=app-builder /build/backend/node_modules/underscore/ /a/node_modules/underscore/

# the front end bundled up as per normal
COPY --from=app-builder /build/backend/client/ /a/client/

# the backend bundled up, including some directory structure imposed by the bundler
# (otherwise we would put it into /a)
COPY --from=app-builder /build/backend/server/ /a/server/

# NOTE a feature of using node directly as the entrypoint is that container signal handling
# correctly passes SIGTERM to the Fastify server which can then shut down gracefully
ENTRYPOINT [ "node", "server/dist/src/entrypoint.js" ]
