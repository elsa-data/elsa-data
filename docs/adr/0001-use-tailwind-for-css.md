# ADR 0001

## Context

The look and feel of an application is controlled using CSS (Cascading Stylesheets). There are a variety
of frameworks/tools that ease the burden on developers for developing CSS. We need to decide on what
CSS framework to use throughout the project.

Our requirements for the CSS framework/tool are:

- We want user experience to be fast and reliable - on popular browsers and screen sizes.
  Whilst our application is going to be used by a variety of organisations - we are not
  aware of any stakeholders who have legacy browser requirements (i.e. use older Internet Explorer)
  and so support for modern popular browsers is the main focus.

- We want rapid iteration on design, layout, UI/UX, etc.

- Our requirements for responsive designs are less so than most application - as many
  other aspects of genomics (downloading files for instance) are not appropriate for
  mobile devices. It is safe to assume that the majority of usage of the
  application will be on a desktop machine.

- The team does not have UI experts - certainly no-one who particularly likes fiddling with CSS.

## Decision

Decided on Tailwind.

## Consequences

What becomes easier or more difficult to do because of this change?
