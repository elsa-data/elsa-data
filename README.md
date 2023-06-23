# Elsa Data

**Genomic data sharing support software ("let the data go")**

Elsa Data is a software stack that helps provide data custodians and researchers
will a collaborative space in which manage the sharing of approved genomic
data sets.

Elsa Data can ingest approved applications from a variety of sources
(REMS, RedCap, manual) and then creates a shared _release_ - a specific web portal area
documenting the details of exactly what data is being shared with
exactly which users and under what circumstances. Elsa Data then enables
point and click mechanics to actually release the genomic objects (object signing,
copy out, access points). All of this sharing activity is strongly audited.

## Development

To get started with development see [development start here](docs/start-here.md).

## Configuration

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
| Modify cases/patients to be included in the release                                                                                    | :white_check_mark: | :x:                | :x:                | :x:                |
| Modify files to be included in the release                                                                                             | :white_check_mark: | :x:                | :x:                | :x:                |
| Modify what type of method allowed for the data access<br>(e.g. only allow `htsget` endpoint)                                          | :white_check_mark: | :x:                | :x:                | :x:                |
| Enable/suspend data sharing in a release                                                                                               | :white_check_mark: | :x:                | :x:                | :x:                |
| Invite/remove an `Administrator` in the release                                                                                        | :white_check_mark: | :x:                | :x:                | :x:                |
| Invite/remove a `Member` or `Manager` in the release                                                                                   | :white_check_mark: | :white_check_mark: | :x:                | :x:                |
| Promote/Demote `Manager` from/to a `Member` role                                                                                       | :white_check_mark: | :white_check_mark: | :x:                | :x:                |
| Edit your own role within the release                                                                                                  | :x:                | :x:                | :x:                | :x:                |
| View all participants in the release                                                                                                   | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| View details of the release<br>(e.g. purpose of release, DAC details)                                                                  | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| View all audit events occurred within the release                                                                                      | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| View password for encrypted manifest.<br>(Manifest will be protected with password to prevent storing it randomly on local directory.) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x:                |
| Accessed the data-content available in the release.                                                                                    | :x:                | :white_check_mark: | :white_check_mark: | :x:                |

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

#### Branding

A logo and brand name can be added to Elsa to indicate what organisation is running the instance. Branding is configured using the configuration subsystem described [here](./docs/deployment/configuration.md). An example JSON5 snippet to add a logo and brand name is as follows:

```json
"branding": {
  "brandName": "UMCCR",
  "logoPath": "/path/to/umccr-logo.png"
}
```

If deploying Elsa as a Docker image, the JSON5 file which contains this configuration can be baked into the image as shown [here](https://github.com/umccr/elsa-data-aws-deploy/blob/6c108c0d35b3d5151ffba8fff3500dcf11c87d79/artifacts/elsa-data-application-deployment-ag-prod-docker-image/Dockerfile#L10). The logo would need to be included in the image similarly.

#### IP Lookup (MaxMind)

When an audit trail leave behind an IP address, we have include a mechanism to lookup the IP address to a real world location. This mechanism requires a [MaxMind Database](https://www.maxmind.com/en/home) which will lookup to its corresponding city and country. If the Database is not included at the deployment the lookup field in the Elsa's database will return empty (-).

To get the MaxMind Geo-City location database, you are required to be authenticated to download the database (the lite version is free). There are 2 ways to download the MaxMind Db.

1. Manually
   1. Click on `MY ACCOUNT` (:bust_in_silhouette:) > `MY ACCOUNT` > `DOWNLOAD DATABASES`
   2. Download the `.mmdb` for the Geo City version (e.g. when using the lite version it is `GeoLite2 City`).
2. License Keys
   1. Setup and retrieve the License Keys from the `MY_ACCOUNT` (:bust_in_silhouette:).
   2. Substitute the key into the following URL `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key={LICENSE_KEYS}&suffix=tar.gz` and paste the URL to your browser address box (or you can do it via `curl`) to download the `GZIP` file.

The downloaded file will be in GZIP file, you could verify the downloaded file with the SHA256 provided. This database will be updated regularly to provide the most accurate location, at the time of writing this, MaxMind will update this database twice a week.

Extract this data (to obtain the `.mmdb` file) and include this file as part of the deployment.

The MaxMind Database path is configured using the configuration subsystem described [here](./docs/deployment/configuration.md). An example JSON5 snippet to add the MaxMind database path is as follows:

```json
"ipLookup": {
  "maxMindDbPath": "path/to/Geo-City.mmdb",
}
```

If deploying Elsa as a Docker image, the JSON5 file which contains this configuration can be baked into the image as shown [here](https://github.com/umccr/elsa-data-aws-deploy/blob/6c108c0d35b3d5151ffba8fff3500dcf11c87d79/artifacts/elsa-data-application-deployment-ag-prod-docker-image/Dockerfile#L10). The `.mmdb` would need to be included in the image similarly.
