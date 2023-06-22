# Start Here

## On Initial Checkout

Elsa Data uses `pre-commit` to maintain some coding norms for all checked in code.

As a one-off activity, on first checkout, devs should run the following in the root
of the project. Pre-commit will need to have been installed
globally (e.g `brew install pre-commit` on a Mac).

```bash
pre-commit install
```

## Setup

The following are assumed to be installed

- nodejs
- edgedb (see https://www.edgedb.com/install)

Then to install dependencies (across all projects) and initialise the database, run from the
root of the project:

```shell
npm install
npm run init-db
```

## Configuration Secrets

Even in development, you will need to store secrets so that things like localhost OIDC flows
work. We support this is a way that prevents checking secrets into source control.

Depending on your machine, secrets can be stored in different locations. Elsa Data has a powerful
meta configuration mechanism that lets you specify where all configuration settings are sourced -
though this is mainly for actually deployment. Out of the box for development we have
set up configurations suitable for specific secrets mechanisms of Mac and Linux.

### Mac with no cloud

For a Mac (with no AWS) - you can make a custom keychain (in this case we set it up with
no timeout or password but you may want to tighten things). See `.env.mac` for where
the meta configuration is specified that names this keychain (`elsa-data`).

```shell
security create-keychain "elsa-data"
security set-keychain-settings "elsa-data"
```

And then set any configuration secrets (add `-U` if updating secrets that have already been set)

```shell
security add-generic-password -a "$USER" -s "oidc.issuerUrl" −w "https://oidc.issuer.org" "elsa-data"
security add-generic-password -a "$USER" -s "oidc.clientId" −w "qwerty123" "elsa-data"
security add-generic-password -a "$USER" -s "oidc.clientSecret" −w "qwerty123" "elsa-data"
```

### Linux with no cloud

For linux with no AWS, the `pass` command can be used to store secrets. `pass` uses gpg keys to manage passwords.
See `.env.linux` for how the password store is named.

To initialize the password store, use a gpg id or email:

```shell
pass init gpg_id_or_email
```

Optionally, the `PASSWORD_STORE_DIR` environment variable can be set to modify where the password store is.

Then store any configuration secrets in an `elsa-data` folder:

```
echo "https://oidc.issuer.org" | pass insert -e elsa-data/oidc.issuerUrl
echo "qwerty123" | pass insert -e elsa-data/oidc.clientId
echo "qwerty123" | pass insert -e elsa-data/oidc.clientSecret
```

This folder can be set in the `.env.linux` metaconfiguration file.

## Run

The Elsa frontend is located in `application/frontend` and the backend in `application/backend`.

If you have set up the secrets according to your operating system, you can
then run a local development version

```shell
npm start
```

Browse to `localhost:3000`.
