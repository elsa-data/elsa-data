
EDGEDB_CLIENT_SECURITY=insecure_dev_mode

docker run -it --rm -e AWS_REGION \
        -e AWS_ACCESS_KEY_ID \
        -e AWS_SECRET_ACCESS_KEY \
        -e AWS_SESSION_TOKEN \
        -e NODE_ENV="development" \
        -e ELSA_DATA_META_CONFIG_SOURCES="file('base') file('dev-common') file('dev-localhost') aws-secret('ElsaDataLocalhost')" \
        -e EDGEDB_CLIENT_SECURITY \
        -e EDGEDB_DSN \
        -e EDGEDB_PASSWORD \
        -p 3000:80 elsa
