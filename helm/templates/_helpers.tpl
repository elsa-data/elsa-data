{{/*
Expand the name of the chart.
*/}}
{{- define "elsa.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "elsa.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "elsa.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "elsa.labels" -}}
helm.sh/chart: {{ include "elsa.chart" . }}
{{ include "elsa.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "elsa.selectorLabels" -}}
app.kubernetes.io/name: {{ include "elsa.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "elsa.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "elsa.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create or generate session key and salt
*/}}
{{- define "secret.session" -}}
{{- $secret := lookup "v1" "Secret" .Release.Namespace "session" -}}
{{- if $secret.data -}}
{{ $secret.data.session | b64dec}}
{{- else -}}
{ "httpHosting": {"session" : {"secret": "{{ randAlphaNum 50 }}","salt": "{{ randAlphaNum 16 }}"}}}
{{- end -}}
{{- end -}}