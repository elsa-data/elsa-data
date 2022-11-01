# elsa-data

Genomic data sharing support software ("let the data go")

## Dev

### Setup

The following are assumed to be installed

- nodejs
- edgedb (see https://www.edgedb.com/install)

Then

1. In each folder containing a `package.json` file, run `npm install`:

```shell
while IFS= read -r -d '' file; do
  dirname=$(dirname "$file")
  (
    cd "$dirname"
    npm install
  ) || exit 1
done < <(find . -name package.json -type f ! -path "*/node_modules/*" -print0)
```

2. In folder `application/frontend`

```shell
npm run build:dev
```

3. In folder `application/backend`

```shell
edgedb project init --non-interactive
npm run edgetypes
```

4. Create local secrets for local boot

You will need to get these actual values out of band (i.e. Slack).

```shell
security add-generic-password -a "$USER" -s 'Elsa Client Id Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa Client Secret Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa REMS Bot User Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
```

### Run Locally

Setup two shell windows, one in `application/frontend` and one in `application/backend`

In the frontend - whenever frontend code is changed - rebuild with

```
npm run build:dev
```

In the backend

```
npm run dev
```

Backend code is automatically monitored and will restart on any code changes.

Browse to `localhost:3000`.

##

https://tkdodo.eu/blog/react-query-fa-qs
