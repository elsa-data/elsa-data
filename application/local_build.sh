# for a Docker built locally to a developer we don't assert any meaningful version/sha
docker build -t elsa . --progress plain --build-arg ELSA_DATA_VERSION=local-dev --build-arg GITHUB_SHA=0000000000000000000000000000000000000000
