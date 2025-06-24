
# NOTE: this will generally not actually work - because there is not enough config or a database..
#       we consider it a success to get to the point where it complains about that!
#       we are really just testing the file system structure of the docker is correct to run bun
#       if you want you can set GEL_DSN to be a pointer to a real Gel db instance and then it might work

(cd backend && docker run -it --rm --init -e AWS_REGION \
        -e AWS_ACCESS_KEY_ID \
        -e AWS_SECRET_ACCESS_KEY \
        -e AWS_SESSION_TOKEN \
        -e NODE_ENV="development" \
        -e ELSA_DATA_META_CONFIG_SOURCES="aws-secret('ElsaDataLocalhost')" \
        -e GEL_CLIENT_SECURITY \
        -e GEL_DSN \
        -p 3000:80 elsa)
