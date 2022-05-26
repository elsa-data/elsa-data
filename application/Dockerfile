FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:16 AS backend-builder

# trigger the npm install *only* on changes to package files
COPY backend/package* ./
RUN npm install

COPY backend/ ./
RUN npx esbuild src/bootstrap-lambda.ts --bundle --platform=node --target=node16 --outfile=lambda.cjs

FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:16 AS frontend-builder

# trigger the npm install *only* on changes to package files
COPY frontend/package* ./
RUN npm install

COPY frontend/ ./
RUN npx craco build

FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:14

# Create this in / which is the location for the other entrypoint scripts provided by AWS
# This allows shell control signals to work when running the Docker image in a shell
# It is only used if running the lambda Docker locally for testing
RUN printf "#!/bin/bash\n$@\n" > /docker-entrypoint.sh

# NOTE: the default WORKDIR for the lambda images is /var/task which we inherit
# So all of these files are going into /var/task

COPY backend/src/favicon.ico ./

COPY --from=backend-builder /var/task/lambda.cjs ./
COPY --from=frontend-builder /var/task/build/ ./client/dist/

CMD [ "lambda.handler" ]
