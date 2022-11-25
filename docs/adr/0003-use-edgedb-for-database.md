# ADR 0003

## Context

The project needs to store data for its operations in some form of database.

## Decision

Use EdgeDb for our primary database.

## Consequences

EdgeDb is a relatively new database with a new graph relational paradigm.
Whilst we believe the paradigm fits well with the type of data we want to
store, there is no long-established track record of the use of this
product.

The business model for EdgeDb is unclear - though there appears to be lots
of funding for the product. It is possible there will be future costs
if the current open source business model changes.
