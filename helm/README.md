# Elsa
[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/elsa)](https://artifacthub.io/packages/search?repo=elsa)


Chart for installing [Elsa](https://github.com/elsa-data/elsa-data), along with postgres and gel db.

## Installation

`helm install my-release oci://australia-southeast1-docker.pkg.dev/dsp-registry-410602/garvan-public/elsa`

## Configuring Elsa
Elsa is normally configured by .json5 files.
The `config` helm value can accept any configuration supported by Elsa.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| config.dacs | list | `[]` |  |
| config.datasets | list | `[]` |  |
| config.emailer.from.address | string | `nil` |  |
| config.emailer.from.name | string | `nil` |  |
| config.emailer.mode | string | `nil` |  |
| config.emailer.sendEmails | bool | `false` |  |
| config.oidc.clientId | string | `nil` |  |
| config.oidc.clientSecret | string | `nil` |  |
| config.oidc.issuerUrl | string | `nil` |  |
| config.ontoFhirUrl | string | `"https://onto.prod.umccr.org/fhir"` |  |

## Postgres config

Refer to [postgres helm chart docs](https://artifacthub.io/packages/helm/bitnami/postgresql).
Use prefix `postgres` to set postgres values. E.g. `postgres.auth.username`

## Full values list

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| autoscaling.enabled | bool | `false` |  |
| autoscaling.maxReplicas | int | `100` |  |
| autoscaling.minReplicas | int | `1` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| config.dacs | list | `[]` |  |
| config.datasets | list | `[]` |  |
| config.emailer.from.address | string | `nil` |  |
| config.emailer.from.name | string | `nil` |  |
| config.emailer.mode | string | `nil` |  |
| config.emailer.sendEmails | bool | `false` |  |
| config.oidc.clientId | string | `nil` |  |
| config.oidc.clientSecret | string | `nil` |  |
| config.oidc.issuerUrl | string | `nil` |  |
| config.ontoFhirUrl | string | `"https://onto.prod.umccr.org/fhir"` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"ghcr.io/elsa-data/elsa-data"` |  |
| image.tag | string | `"pr-557"` |  |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.className | string | `""` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"chart-example.local"` |  |
| ingress.hosts[0].paths[0].path | string | `"/"` |  |
| ingress.hosts[0].paths[0].pathType | string | `"ImplementationSpecific"` |  |
| ingress.tls | list | `[]` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podAnnotations | object | `{}` |  |
| podLabels | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `80` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.automount | bool | `true` | Automatically mount a ServiceAccount's API credentials? |
| serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| serviceAccount.name | string | `""` | If not set and create is true, a name is generated using the fullname template |
| tolerations | list | `[]` |  |
| volumeMounts | list | `[]` |  |
| volumes | list | `[]` |  |