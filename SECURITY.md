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

We have taken steps to ensure that every user has the authorisation checks before accessing the related resources. We have implemented boundary rule checks where only related participants and administrators can view the detail of the release. This rule is implemented in the user interface where it disables the actions that are not authorised as well as on our backend that throws an error if unauthorised request is being made to the system.

In addition, we also explicitly separate the layer of the sharing configuration and accessing the datasets. With this, we have made that only participants (managers and members) can access the datasets (e.g. generate presigned-urls) where the administrator can only organise what and how the datasets are available to them.

Do note, there is a possible risk where the administrator configures the sharing configuration (e.g. a copy-out to an S3-bucket mechanism), where the destination bucket is their own bucket.

### 2. Cryptographic Failures

We are using the HTTPS protocol to protect data traffic, which enables encryption between networks. This prevents attackers from tapping into the network and intercepting the transmitted data. Additionally, Elsa's database does not store sensitive data. It primarily stores indexes for specific genomic datasets, including subject IDs that do not identify specific individuals.

For file encryption, to ensure the security of active presigned URL files, we encrypt them with a randomly generated UUID, which is stored in the database. This prevents participants from storing unencrypted presigned URLs locally. Participants can obtain the password for accessing these files through the application. Currently, the password is stored as a string as the purpose of this feature is solely to protect unencrypted files stored on local devices.

### 3. Injection

In Elsa, we have implemented various measures to minimize the risk of injection attacks, particularly by carefully handling user-supplied input. Most of the inputs in our application are checkboxes, which significantly reduce the chances of injection vulnerabilities. Furthermore, we have eliminated the use of raw SQL queries in our database interactions. Instead, we leverage the [EdgeDb Client Library](https://www.edgedb.com/docs/clients/js/index) and a predefined [EdgeQL](https://www.edgedb.com/docs/edgeql/index) template for our database queries. These client libraries and EdgeQL templates follow strict casting rules, ensuring data integrity before any interaction with the underlying SQL database.

To protect against cross-site scripting (XSS) and other injection attacks on the client-side, we have implemented a robust Content-Security-Policy (CSP). This policy prevents the browser from fetching or executing any content that is not explicitly whitelisted by the server. By enforcing this policy, we significantly reduce the risk of XSS and other injection attacks targeting the client-side.

### 4. Insecure Design

In line with the other OWASP topics of injection and authentication, we have implemented measures to minimize the potential risks associated with user input. By reducing the number of user inputs, we aim to limit the opportunities for attackers to exploit vulnerabilities within the application. Additionally, we have implemented CILogon, a robust authentication solution that ensures the authenticity of users accessing the application.

Furthermore, our application has been designed with cloud-native deployment in mind, with AWS being the primary cloud provider we have tested and deployed on. By leveraging the capabilities of a cloud-native environment, we can offload a significant portion of security-related attacks and ensure high availability through the cloud provider's infrastructure. For a more detailed review of our AWS deployment design, you can refer to our dedicated repository at https://github.com/umccr/elsa-data-aws-deploy.

Another important aspect of our design is the support for HTSGET, a data sharing mechanism. HTSGET enables the data custodian to control access to specific alignments within genomic files, ensuring that participants can only access the relevant data instead of providing access to the entire file. For more information on HTSGET, please visit the official documentation at http://samtools.github.io/hts-specs/htsget.html.

### 5. Security Misconfiguration

The application configuration is stored in the dedicated configuration folder, which is copied into the container image during deployment. This configuration folder is organized into sub-topics, such as super-admins and the list of datasets, and is parsed using the a [convict library](https://github.com/mozilla/node-convict/tree/master). By centralizing the high vulnerability configuration in this folder, we minimize the risk of accidental modifications. It is important to note that any changes to the configuration can only be made when rebooting the application. This deliberate approach provides an added layer of protection, reducing the chances of unintended configuration modifications.

With regards to deployment configuration, we have established a crafted template for safe deployment on AWS. This template is designed to provide a safe and reliable deployment setup, incorporating preconfigured settings that we believe are secure. To access our Elsa CDK deployment template please visit https://github.com/umccr/elsa-data-aws-deploy.

### 6. Vulnerable and Outdated Component

On our repository, we currently have set up a [dependabot](https://github.com/dependabot) to notify for any alarming version of the library used in the project.

### 7. Identification and Authentication Failures

The application does not have a username-password approach for user identification which removed many security threats on this. We rely on [CILogon](https://www.cilogon.org/home) as an integrated identity that supports over 4000 identity providers. We will assume that researcher is part of an institution therefore it is expected for their institution IDP and is part of CILogon. To add an institution to be part of CILogon, please head up to the [Add Identity Provider page from CILogon](https://www.cilogon.org/service/addidp).

The current login is stored in a cookie session and for time being this cookie will expire within a day after the login attempt.

### 8. Software and Data Integrity Failures

We have placed a strong emphasis on data integrity in our application by carefully designing the database to support checksum values for stored objects. As part of the release process, a checksum is included in the manifest for each file. This checksum serves as a unique identifier and ensures the integrity of the downloaded files. Participants can verify the integrity of the downloaded files by comparing the calculated checksum with the provided checksum in the manifest.

### 9. Security Logging and Monitoring Failures

We have implemented extensive logging capabilities to capture user interactions within the system. Following the [FHIR audit event documentation](https://www.hl7.org/fhir/valueset-audit-event-action.html), we have adopted a transactional auditing pattern to store audit records in the database. These audit records are made available for viewing by relevant users, ensuring awareness of system activities. For instance, participants involved in a specific release can easily access a comprehensive log of events related to that particular release.

Additionally, we have enhanced logging by implementing data egress logs, as data access is a primary function of the application. If enabled by the software administrator (which currently only works in the AWS deployment), this feature tracks the data egressed by each researcher. For example, when a researcher generates pre-signed URLs for a dataset, accessing those URLs triggers the retrieval of information from the storage server, which is then stored in the application database. Data custodians can monitor and log these activities, and certain events, such as data downloads from foreign IP addresses or multiple downloads, are flagged to highlight potential anomalies and to track egress costs.

### 10. Server-Side Request Forgery (SSRF)

WIP

### 11. Cross-Site Request Forgery (CSRF)

This is not on the TOP10 OWAPS but it attracts our attention since our authentication relies on a session cookie. We have implemented CSRF prevention by enforcing CSRF tokens in our internal route to prevent this attack. The token is sent to the client as a cookie that will be used as a header when hitting the APIs. The token generation is used from [csrf-protection](https://github.com/fastify/csrf-protection) as part of the Fastify framework.
