# elsa-data

Genomic data sharing support software ("let your data go")

## Dev

### Setup

The following are assumed to be installed

- nodejs
- edgedb (see https://www.edgedb.com/install)

Then

1. In folder `application/common`

```shell
npm install
```

2. In folder `application/frontend`

```shell
npm install
npm run build:dev
```

3. In folder `application/backend`

```shell
npm install
edgedb project init
npm run edgetypes
```

4. Create local secrets for local boot

You will need to get these actual values out of band (i.e. Slack).

```shell
security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
security add-generic-password -a "$USER" -s 'Elsa REMS Bot Key Dev' -w 'qwerty123'
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
