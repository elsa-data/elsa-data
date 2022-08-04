
EDGEDB_CLIENT_SECURITY=insecure_dev_mode

docker run -it --rm -e EDGEDB_CLIENT_SECURITY -e EDGEDB_DSN -e EDGEDB_PASSWORD -p 3000:80 elsa
