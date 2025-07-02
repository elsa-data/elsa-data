
#
# Used by various stages
#

# pin software versions
ARG GEL_VERSION=6.7
ARG BUN_VERSION=1.2.16

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
# Database builder to create all generated schema related files that require an installed database
# NOTE: the database here is used *only* for the purposes of generating schema related files
#       it is not the actual database for the running system
#
FROM geldata/gel:${GEL_VERSION} AS gel-builder

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
# Application builder makes the frontend and backend with a stripped down directory structure
#
FROM node:22-bookworm  AS app-builder

# set by the buildx and needed for chosing the right bun executable
ARG TARGETARCH
# passed in version pin - see top of Dockerfile
ARG BUN_VERSION

WORKDIR /build

# bring in precisely everything we need to make our "deployed" directory structure
COPY --from=gel-builder /build/dbschema/migrations/ /build/backend/dbschema/migrations/
COPY --from=gel-builder /build/dbschema/edgeql-js/ /build/backend/dbschema/edgeql-js/
COPY --from=gel-builder /build/dbschema/interfaces.ts /build/backend/dbschema/
COPY --from=gel-builder /build/dbschema/queries.ts /build/backend/dbschema/
COPY backend/emails/ /build/backend/emails/
COPY backend/locales/ /build/backend/locales/
COPY backend/src/ /build/backend/src/
COPY backend/bun.lock /build/backend/
COPY backend/bunfig.reflect-metadata-import.js /build/backend/
COPY backend/bunfig.toml /build/backend/
COPY backend/package.json /build/backend/
COPY backend/tsconfig.json /build/backend/

# install packages for the backend using our chosen runtime (bun)

# download specific versioned binaries into files matching Docker $TARGETARCH naming format
ADD https://github.com/oven-sh/bun/releases/download/bun-v$BUN_VERSION/bun-linux-x64.zip bun-amd64.zip
ADD https://github.com/oven-sh/bun/releases/download/bun-v$BUN_VERSION/bun-linux-aarch64.zip bun-arm64.zip

RUN unzip -j bun-$TARGETARCH.zip -d bun-unzipped
RUN : \
 && cd backend \
 && ../bun-unzipped/bun install --frozen-lockfile

# add in a proper compile step - which whilst not needed for runtime does help keep
# crazy errors away (bun does not actually do type checking)
RUN : \
 && cd backend \
 && ../bun-unzipped/bun x tsc --noEmit

# build the frontend
COPY frontend/ /build/frontend/
RUN cd frontend && npm ci
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
FROM debian:bookworm-slim

# put passed in build args into the environment for use by the running server


# we want to embed into the image environment immutable tags passed in by the build environment
# this is the 'semantic' version as set by developers i.e. 1.0.3
ARG ELSA_DATA_VERSION
# this is the literal timestamp of building
ARG ELSA_DATA_BUILT
# this is the github revision tag that precisely indicates the commit trigger
ARG ELSA_DATA_REVISION

RUN ["/bin/bash", "-c", ": ${ELSA_DATA_VERSION:?Build argument needs to be set and not null.}"]
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_BUILT:?Build argument needs to be set and not null.}"]
RUN ["/bin/bash", "-c", ": ${ELSA_DATA_REVISION:?Build argument needs to be set and not null.}"]
ENV ELSA_DATA_VERSION=$ELSA_DATA_VERSION
ENV ELSA_DATA_BUILT=$ELSA_DATA_BUILT
ENV ELSA_DATA_REVISION=$ELSA_DATA_REVISION

EXPOSE 80

WORKDIR /a

# the bun runtime
COPY --from=app-builder /build/bun-unzipped/bun .

# the fully built application
COPY --from=app-builder /build/backend/ /a/

# we bring in a Gel CLI binary for some
# admin level activity (runnings migrations etc)
# NOTE this is a path that is just referred to in the code of the entrypoint - so this is just expected to exist for
# some things to function
# TODO add a startup check into elsa to make sure it does exist
COPY --from=gel-builder /usr/bin/gel /a/

ENTRYPOINT [ "/a/bun", "src/entrypoint.ts" ]
