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
#RUN cd backend && npx esbuild src/bootstrap-aws.ts --bundle --external:sodium-native --external:node-gyp-build --platform=node --target=node18 --outfile=./elsa.cjs

# we also bundle each Bree job as an individual bundle
#RUN cd backend && npx esbuild jobs/select-job.ts --bundle --platform=node --target=node18 --outfile=./select-job.js

#
# Deployed app
#
FROM amazonlinux:2022

WORKDIR /app

# TODO: Discard the useless stuff using a multi-stage build
COPY . .

RUN dnf install -y nodejs npm findutils shadow util-linux

RUN useradd app-user

RUN chown -R app-user /app

SHELL ["/usr/bin/su", "app-user", "-c"]

RUN : \
  && curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com > edgedb.sh \
  && sh edgedb.sh -y \
  && rm edgedb.sh

RUN \
  while IFS= read -r -d '' file; do \
    dirname=$(dirname "$file"); \
    ( \
      cd "$dirname" && \
      npm install; \
    ) || exit 1; \
  done < <(find . -name package.json -type f ! -path "*/node_modules/*" -print0)

RUN : \
  && cd frontend \
  && npm run build:dev

RUN : \
  && cd backend \
  && export EDGEDB_INSTALL_IN_DOCKER=allow \
  && ~/.local/bin/edgedb project init --non-interactive \
  && npm run edgetypes

ARG ELSA_DATA_VERSION
ENV ELSA_DATA_VERSION $ELSA_DATA_VERSION

ARG GITHUB_SHA
ENV GITHUB_SHA $GITHUB_SHA

RUN echo "export ELSA_DATA_VERSION=$ELSA_DATA_VERSION" >> ~/.profile
RUN echo "export GITHUB_SHA=$GITHUB_SHA" >> ~/.profile



# TODO: careful crafting has broken stuff.. for the moment just throwing everything together
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

EXPOSE 80

WORKDIR /app/backend

# ENTRYPOINT [ "node", "elsa.cjs" ]
ENTRYPOINT [ "node", "--loader", "ts-node/esm", "src/bootstrap-aws.ts" ]
