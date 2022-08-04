#
# We use a single builder for both frontend and backend as they share
# some common code and setup
#
FROM amazonlinux:2022 AS backend-builder

RUN dnf install -y nodejs

WORKDIR /build

#RUN yum install -y gcc-c++ make
#RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
#RUN yum install -y nodejs

# the common packages need to be already in place in the folder struct *before* npm install
COPY common/ ./common/

# install packages
COPY backend/package* ./backend/
RUN cd backend && npm clean-install
COPY frontend/package* ./frontend/
RUN cd frontend && npm clean-install

# create the react app
# (frontend build is *way* slower than backend so we do this first to hopefully docker cache)
COPY frontend/ ./frontend/
RUN cd frontend && npx react-scripts build

# now compile the backend files
# NOTE: we currently exclude from bundling
#   sodium-native and node-gyp-build - these don't get bundled well because they are about native libs etc
COPY backend/ ./backend/
RUN cd backend && npx esbuild src/bootstrap-aws.ts --bundle --external:sodium-native --external:node-gyp-build --platform=node --target=node18 --outfile=./elsa.cjs

#
# The actual deployed app
#
FROM amazonlinux:2022

#RUN yum install -y gcc-c++ make
#RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
#RUN yum install -y nodejs

WORKDIR /app

RUN dnf install -y nodejs

# Create this in / which is the location for the other entrypoint scripts provided by AWS
# This allows shell control signals to work when running the Docker image in a shell
# It is only used if running the lambda Docker locally for testing
# RUN printf "#!/bin/bash\n$@\n" > /docker-entrypoint.sh

# NOTE: the default WORKDIR for the lambda images is /var/task which we inherit
# So all of these files are going into /var/task

COPY backend/src/favicon.ico ./

COPY --from=backend-builder /build/backend/node_modules/node-gyp-build/ ./node_modules/node-gyp-build/
COPY --from=backend-builder /build/backend/node_modules/sodium-native/ ./node_modules/sodium-native/
COPY --from=backend-builder /build/backend/package.json ./
COPY --from=backend-builder /build/backend/elsa.cjs ./
COPY --from=backend-builder /build/frontend/build ./client/dist/

#RUN printf "#!/bin/bash\ncd /app/backend && npx ts-node /app/backend/src/bootstrap-aws.ts\n" > /app/start.sh
#RUN chmod a+rx /app/start.sh

CMD [ "node", "elsa.cjs" ]
