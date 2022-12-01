# ADR 0002

## Context

The project involves a web based user interface. We need to make a choice of technology
for implementing that UI.

- All developers in the team are currently familiar with React and it is a popular
  UI framework with wide industry acceptance.

- It is easy to hire staff with React experience.

- Our UI requirements are lightweight - we are not going to be a high volume website (where
  UI bandwidth is a defining cost), or a high speed website (where UI responsiveness is
  a defining feature). This argues against some of the newer frameworks that aim for
  higher efficiency/speed over React.

## Decision

Use React for the web user interface.

## Consequences

React is a mainstream UI framework now - the consequences of which are that it is no
longer the place where highly innovative UI techniques are occurring. We may be
ruling ourselves out of some efficiencies in terms of developer experience, or ruling ourselves
out of literally new framework features (say in Svelte) - due to choosing React.
