# elsa-data

Genomic data sharing support software ("let the data go")

## Dev

### Setup

The following are assumed to be installed

- nodejs
- edgedb (see https://www.edgedb.com/install)

Then

1. To install dependencies, run:

```shell
npm install
```

2. To start run the following:

```shell
npm run init-db
npm start
```

3. Create local secrets for local boot

You will need to get these actual values out of band (i.e. Slack).

```shell
security add-generic-password -a "$USER" -s 'Elsa Client Id Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa Client Secret Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa REMS Bot User Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
```

### Run Locally

The Elsa frontend is located in `application/frontend` and the backend in `application/backend`.

Whenever frontend code is changed - rebuild with:

```shell
npm run frontend
```

For the backend:

```shell
npm run backend
```

Backend code is automatically monitored and will restart on any code changes.

Browse to `localhost:3000`.

##

https://tkdodo.eu/blog/react-query-fa-qs
