# for a Docker built locally to a developer we don't assert any meaningful version/sha
docker build -t elsa . --progress plain \
   --build-arg ELSA_DATA_VERSION=local-dev \
   --build-arg ELSA_DATA_BUILT="$(date -Iseconds)" \
   --build-arg ELSA_DATA_REVISION=0000000000000000000000000000000000000000
