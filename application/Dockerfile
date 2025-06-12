
#
# Sources Nodejs binaries without having to package install them (ok as long as both images shared common Slim base)
# Also install the specific Gel packages we use
# Note unlike the gel-builder, we have a functional npm which is why we do this here
# Based on techniques from https://discord.com/channels/841451783728529451/955887885557579788/955946426322522153
#
FROM node:22-bookworm AS node-deps

WORKDIR /build

COPY backend/package.json package.json

# from the existing package.json we create a new package.json with *just* the gel dependencies
# and npm install them
RUN echo '{ \
    "dependencies": {' $(grep -E -o '"gel":\s"(.*)"' package.json) '}, \
    "devDependencies": {' $(grep -E -o '"@gel/generate":\s"(.*)"' package.json) '} \
    }' > package.json && npm install

#
# Database builder to create all generated files that require the install database
#
FROM geldata/gel:6.7 AS gel-builder

# bring in the compatible node binary
COPY --from=node-deps /usr/local/bin/node /usr/local/bin/node

# setup a /build that gel can work in
RUN mkdir /build && chown gel:gel /build
USER gel
WORKDIR /build

# bring in node_modules with our installed packages
COPY --from=node-deps /build .

# gel needs the dbschema folder which has the schemas/migrations/queries
COPY --chown=gel ./backend/dbschema/ dbschema/

#     #

# NOTE: the & and && here has some pretty subtle interaction - be careful working on this
# NOTE: the deliberate absence of .ts on the queries generated 'file' (is auto added by generate)
RUN gel-server-6 \
    -D /build/data \
    --security insecure_dev_mode \
    --runstate-dir /build/runstate \
    & gel migration apply \
          -H localhost \
          --tls-security insecure \
          --wait-until-available 2m \
    && cd /build/dbschema \
    && node ../node_modules/.bin/generate edgeql-js \
    -H localhost \
    --target ts \
    --force-overwrite \
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
# Application builder makes the frontend and backend
#
FROM node:22-bookworm  AS app-builder

WORKDIR /build

# this doesn't affect the image size - but does affect the time taken to build - possibly
# can fix - we don't use Docker in dev though so maybe it doesn't really matter
COPY . .

ADD https://github.com/oven-sh/bun/releases/latest/download/bun-linux-aarch64.zip bun.zip
RUN unzip bun.zip

RUN cd backend && ../bun-linux-aarch64/bun install
RUN cd frontend && npm ci

# add in an extra compile step - which whilst not needed for runtime does help keep
# crazy errors away (bun does not actually do type checking)
# RUN : \
#  && cd backend && ../bun-linux-aarch64/bun x tsc --noEmit

RUN : \
  && cd frontend \
  && npm run prod:build


#
# Deployed Elsa Data application
#
# No building actually done in this image to hopefully minimise size
#
# NOTE we use binaries here that are sourced directly from the gel image
# https://github.com/geldata/gel-docker/blob/master/Dockerfile
# so our choice of FROM image is somewhat constrained to something vaguelly compatible
#
FROM oven/bun:1.2-debian

# we want to embed into the image environment immutable tags passed in by the build environment
# this is the 'semantic' version as set by developers i.e. 1.0.3
ARG ELSA_DATA_VERSION
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_VERSION:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_VERSION=$ELSA_DATA_VERSION

# this is the literal timestamp of building
ARG ELSA_DATA_BUILT
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_BUILT:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_BUILT=$ELSA_DATA_BUILT

# this is the github revision tag that precisely indicates the commit trigger
ARG ELSA_DATA_REVISION
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_REVISION:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_REVISION=$ELSA_DATA_REVISION

EXPOSE 80

WORKDIR /a

# we use a matching CLI binary from our builder - and keep it for some admin level activity (migrations etc)
# NOTE this is a path that is just referred to in some of the entrypoint - so this is just expected to exist for
# some things to function
# TODO add a startup check the make sure it does exist
COPY --from=gel-builder /usr/bin/edgedb /a/

COPY --from=app-builder /build/backend/ /a/

# bring in needed configs and migrations
# NOTE these need to be relative to the current directory of where node launches from (not relative to entrypoint src)
COPY --from=gel-builder /build/dbschema/migrations/ /a/dbschema/migrations/
COPY --from=gel-builder /build/dbschema/edgeql-js/ /a/dbschema/edgeql-js/
COPY --from=gel-builder /build/dbschema/interfaces.ts /a/dbschema/
COPY --from=gel-builder /build/dbschema/queries.ts /a/dbschema/

#COPY --from=app-builder /build/backend/locales/ /a/locales/
#COPY --from=app-builder /build/backend/emails/ /a/emails/

# the front end bundled up as per normal
#COPY --from=app-builder /build/backend/client/ /a/client/


# NOTE a feature of using node directly as the entrypoint is that container signal handling
# correctly passes SIGTERM to the Fastify server which can then shut down gracefully
ENTRYPOINT [ "bun", "src/entrypoint.ts" ]
