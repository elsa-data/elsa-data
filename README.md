# elsa-data

Genomic data sharing support software ("let the data go").

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

### Configuration Secrets

Even in development, you will need to store secrets so that things like localhost OIDC flows
work. We enable this is a way that does not require checking secrets in source control.

Depending on your machine, secrets can be stored in different locations. Elsa Data has a powerful
meta configuration mechanism that lets you specify where all configuration settings are sourced
(see ELSA_DATA_META_CONFIG_SOURCES below)

#### Mac with no cloud

For a Mac (with no AWS) - you can make a custom keychain (in this case we set it up with
no timeout or password but you may want to tighten things). See `.env.mac` for where
the meta configuration is specified naming the keychain.

```shell
security create-keychain elsa-data
security set-keychain-settings elsa-data
```

And then set any configuration secrets

```shell
security add-generic-password -a "$USER" -s "oidc.issuerUrl" −w "https://test.cilogon.org" elsa-data
security add-generic-password -a "$USER" -s "oidc.clientId" −w "qwerty123" elsa-data
security add-generic-password -a "$USER" -s "oidc.clientSecret" −w "qwerty123" elsa-data
security add-generic-password -a "$USER" -s "rems.botUser" −w "qwerty123" elsa-data
security add-generic-password -a "$USER" -s "rems.botKey" −w "qwerty123" elsa-data
```

#### AWS

For a Mac that will be run with credentials for AWS - you should
probably just create an AWS Secrets Manager secret and put configuration there.

See `.env.aws` for where the meta configuration names the specific Secret to use.

#### Linux with no cloud

For linux with no AWS, the `pass` command can be used to store secrets. `pass` uses gpg keys to manage passwords.
See `.env.linux` for how the password store is named.

To initialize the password store, use a gpg id or email:

```shell
pass init gpg_id_or_email
```

Optionally, the `PASSWORD_STORE_DIR` environment variable can be set to modify where the password store is.

Then store any configuration secrets in an `elsa-data` folder:

```
echo "https://test.cilogon.org" | pass insert -e elsa-data/oidc.issuerUrl
echo "qwerty123" | pass insert -e elsa-data/oidc.clientId
echo "qwerty123" | pass insert -e elsa-data/oidc.clientSecret
echo "qwerty123" | pass insert -e elsa-data/rems.botUser
echo "qwerty123" | pass insert -e elsa-data/rems.botKey
```

This folder can be set in the `.env.linux` metaconfiguration file.

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

## Meta configuration

Elsa Data uses two environment variables to set up a _meta_ configuration
system. The meta systems job is to specify where the real configuration data
can be sourced and the order in which it should be sourced.

### `ELSA_DATA_META_CONFIG_FOLDERS`

A OS dependent (delimiter `;` or `:`) separated list of folders in which configuration files can be sourced.
Folder names can be absolute paths or relative to the starting directory of
the backend (i.e. the folder containing the backend `package.json`).

An example of this for Mac might be

`/Users/person/configs:./config`

### `ELSA_DATA_META_CONFIG_SOURCES`

A small mini language listing providers of configuration - for the moment
see the actual source in `src/config/meta`. More instructions to follow.

An example of this though is

`file('base') file('dev-common') file('dev-localhost') file('datasets') osx-keychain('elsa-data')`

## Links

https://tkdodo.eu/blog/react-query-fa-qs
