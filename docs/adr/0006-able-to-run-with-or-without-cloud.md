# ADR 0006

## Context

An application can be designed with native cloud deployment as the primary
focus, or can be designed to use more neutral (non cloud) technologies. The
project needs to decide whether it is adopting cloud native technologies at the
outset.

The application is designed to be run close to the location of the datasets
being shared, as that is the location most able to be able to deal with
editing file permissions, indexing datasets etc. The application is meant to
be run _by the data holder_ in _their_ environment - not by neutral parties.

Current datasets are held by many institutes across a wide variety
of environments, both cloud and non-cloud (institute HPC etc).

## Decision

Decided on non-cloud as deployment to HPC/internal is a required use case.

## Consequences

This decision rules out the use of native cloud services for core
aspects of the product. For instance, if we need a message queue at the core
of the product - we would not be able to just simply use AWS SQS - but
instead will need to configure/install queueing structures that work
in non-cloud environments.

There are cost/efficiency consequences due to not being able to use
cloud native services - that are often easier to use and able to be used
at little cost (e.g. serverless technology AWS Lambda/GCP Functions).

This decision _does not_ rule out the use of cloud technology - indeed many
features will require intersections with cloud stores for instance. However
those features must be optional, and cannot be core parts of the system. For example,
the functionality to alter AWS Bucket permissions may only work/be enabled
when running in AWS - and cannot be a core dependency of the application.

The decision points to primarily using Docker/container based techniques for
deploying/running the application - as these are widely supported for deployment
across both cloud and non-cloud.
