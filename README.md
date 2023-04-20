# elsa-data

Genomic data sharing support software ("let the data go").

### Permissions and Roles

#### Super Admin Permissions

Super admins must be listed in the Elsa Data configuration files - and cannot be changed dynamically
(to add/remove super admin rights for a user - one of the configuration sources must be changed -
and the system restarted).

NOTE the following permissions are the _only_ permissions granted by being listed as a super admin. Super
admins will not otherwise be able to do anything that an ordinary user cannot - until they grant themselves
further user permissions.

| Permission                      | Description                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `isAllowedChangeUserPermission` | Allows the user to change the "user permissions" (see below) of users (including themselves) |

#### User Permissions

Within the overall system context (i.e. outside any specific release) the following user permissions can be granted.

| Permission                          | Description                                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isAllowedOverallAdministratorView` | This permissions grants an implicit Viewer role for releases where this user is not otherwise involved                                                   |
| `isAllowedCreateRelease`            | Allow user to create a new release via any configured DAC mechanisms                                                                                     |
| `isAllowedRefreshDatasetIndex`      | Allow the user to update the current dataset index by triggering the respective indexing task. This includes fetching data-egress records if configured. |

All of these permissions will be disabled on first log in for a user.

#### Release Roles

In the context of each release, users are assigned a Role which affects the permissions
they are granted. When a user is granted a role in a release - we say they are involved in the release. This
is the primary security boundary of the system - users must be involved in a release in order
to see or interact with it in the UI/API (NOTE with the caveat of the Viewer role listed below).

| Roles           | Description                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Administrator` | Given to the data custodians of the release                                                                                                                                                                                                                                                       |
| `Manager`       | Given to the managers of this release from the perspective of the applicant (i.e. project manager / CI / PI)                                                                                                                                                                                      |
| `Member`        | Given by the `Manager`/`Administrator` to access the data in the release. The use case for this is a person from the research group need to access the given data, but instead of using the `Manager` credentials to retrieve it, the manager could delegate this (`Member`) role to that person. |
| `Viewer`        | An implicit role given to those with `isAllowedOverallAdministratorView` and who otherwise aren't involved in a release                                                                                                                                                                           |

Permissions bound on each role are as follows.

|                                                                                                                                        | `Administrator`    | `Manager`          | `Member`           | `Viewer`           |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------ | ------------------ | ------------------ |
| Modify cases/patients to be included in the release                                                                                    | :white_check_mark: | :x:                | :x:                |                    |
| Modify files to be included in the release                                                                                             | :white_check_mark: | :x:                | :x:                |                    |
| Modify what type of method allowed for the data access<br>(e.g. only allow `htsget` endpoint)                                          | :white_check_mark: | :x:                | :x:                |                    |
| Enable/suspend data sharing in a release                                                                                               | :white_check_mark: | :x:                | :x:                |                    |
| Add/remove `Member` from the release                                                                                                   | :white_check_mark: | :white_check_mark: | :x:                |                    |
| Promote/Demote `Manager` from/to a `Member` role                                                                                       | :white_check_mark: | :white_check_mark: | :x:                |                    |
| View details of the release<br>(e.g. purpose of release, DAC details, user involved in the release)                                    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| View all audit events occurred within the release                                                                                      | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| View password for encrypted manifest.<br>(Manifest will be protected with password to prevent storing it randomly on local directory.) | :white_check_mark: | :white_check_mark: | :white_check_mark: |                    |
| Accessed the data-content available in the release.                                                                                    | :x:                | :white_check_mark: | :white_check_mark: |                    |

## Dev

### On Checkout

Elsa Data uses `pre-commit` to maintain some coding norms for all checked in code.

As a one-off activity, on first checkout, devs should run the following in the root
of the project. Pre-commit will need to have been installed globally (e.g `brew install pre-commit` on a Mac).

```bash
pre-commit install
```

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
(with the exception of GCP-related secrets. See [GCP Secrets](#gcp-secrets) below.
For all other secrets, see [ELSA_DATA_META_CONFIG_SOURCES](#ELSA_DATA_META_CONFIG_SOURCES).)

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

#### GCP Secrets

GCP credentials are provided using Google's
[Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials).
Unlike other configuration which Elsa uses, GCP sources configuration from the
environment.

Unless running in a GCP environment, a service account must be used for
authorization. This is important for signing URLs in particular. See
[here](https://cloud.google.com/iam/docs/creating-managing-service-accounts) to
learn how to create a service account.

When using a service account, you must create a key file as described
[here](https://cloud.google.com/iam/docs/creating-managing-service-account-keys).
You must set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the
`path/to/the/key.json`.

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
