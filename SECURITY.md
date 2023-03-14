# Security Policy

## Supported Versions

Elsa Data is currently under development and has no supported versions yet.

| Version | Supported          |
| ------- | ------------------ |
| dev.    | :white_check_mark: |

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
declined, etc.

## The Open Worldwide Application Security Project (OWASP)

We tried as much as possible to protect this software from any security threat. OWASP is a non-profit organization that helps application owner to protect from any cyber security threat. We have used their TOP10 list from [OWASP Top 10 - 2021](https://owasp.org/Top10/) for us to have the security guidelines.

### 1. Broken Access Control

WIP [#197](https://github.com/umccr/elsa-data/pull/197).

Known issue: For time being, every logged-in user has the same level of authorisation.

### 2. Cryptographic Failures

We are using HTTPS protocol to protect data traffic which allows encryption between networks. This will prevent attackers from tapping into the network and listening to the data transmitted. We do not store sensitive data as part of Elsa's database and mainly store the index for the particular genomic datasets. This index will contain subjectId but it does not identify a specific person.

Known issue: For time being manifest file that researchers will have access to the manifest (as part of the release) is governed by the password set by the data custodian. Currently, we store passwords as it is in plain text stored in edgedDb.

### 3. Injection

Most injections happen from input that is supplied by the user. In `Elsa` we have managed to have very minimum input fields that minimise the chance of having an injection attack. At the time we do not use any raw queries to EdgeDb and use [EdgeDb Client Libraries](https://www.edgedb.com/docs/clients/index) for database queries.

We also have implemented `Content-Security-Policy` to protect browser from fetching or executing content that is not white-listed from the server. This will help preventing cross-site scripting (XSS) and injections happening in the client side.

### 4. Insecure Design

We tried our best to maximise our design as securely as possible. We do not allow username-password authentication, many user inputs are just clicking checkboxes preventing any miscellaneous inputs, and configuration is done on application startup to prevent unauthorised config change.

One of our attempts in our design is to support HTSGET for data sharing. HTSGET would allow the data custodian to limit a particular alignment that is accessible by the researcher instead of giving access to the entire genomic file. For more information on HTSGET visit http://samtools.github.io/hts-specs/htsget.html

### 5. Security Misconfiguration

WIP

The app ideally is deployed by the application administrator which would need to configure permission to access the storage server. The administrator would also need to deploy this app in their choice of the cloud provider. We have provided a template of IaC which helps them to deploy applications with the recommended configuration.

### 6. Vulnerable and Outdated Component

The current project is still in development therefore, we will be using the latest version of the framework and components that are available. We will continue to monitor security frameworks and in addition the repository, we have set up a [dependabot](https://github.com/dependabot) that will warn for any alarming version installed in our repository.

### 7. Identification and Authentication Failures

The application does not have a username-password approach for user identification which removed many security threats on this. We rely on [CILogon](https://www.cilogon.org/home) as an integrated identity that supports over 4000 identity providers. We will assume that researcher is part of an institution therefore it is expected for their institution IDP and is part of CILogon. To add an institution to be part of CILogon, please head up to the [Add Identity Provider page from CILogon](https://www.cilogon.org/service/addidp).

The current login is stored in a cookie session and for time being this cookie will expire within a day after the login attempt.

### 8. Software and Data Integrity Failures

We have take into account of data integrity and design the database that stored object to support checksums value. A checksum will be included in the manifest as part of the release and researcher may verify this checksum upon downloading the files.

### 9. Security Logging and Monitoring Failures

We have included as much logging as we could for activities in this app. These logs are stored in the EdgeDb database with no TTL implemented, which allows for trace back at any point in time for any breaches.

In another attempt to improve logging, we also implement data egress logs as the main of the app is giving data access. If the software administrator configured this feature, the data being accessed could be tracked by which researcher. For example, a researcher generates pre-signed URLs for a given dataset. When these URLs are being accessed, information from the storage server could be fetched and bring it to the application database. For data custodian, monitoring and logging of these are shown and highlighted if for example data was downloaded with IP from another country, or downloaded more than once which increase egress cost.

### 10. Server-Side Request Forgery (SSRF)

WIP

### 11. Cross-Site Request Forgery (CSRF)

This is not on the TOP10 OWAPS but it attracts our attention since our authentication relies on a session cookie. We have implemented CSRF prevention by enforcing CSRF tokens in our internal route to prevent this attack. The token is sent to the client as a cookie that will be used as a header when hitting Elsa's API. The token generation is used from [csrf-protection](https://github.com/fastify/csrf-protection) as part of the Fastify framework.
