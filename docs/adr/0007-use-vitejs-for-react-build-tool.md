# ADR 0007

## Context

React is a agnostic to the mechanism by which it is built/bundled - but
obviously a tool needs to be chosen that does this building.

Out of the box the simplest to use is create-react-app (CRA), which is
the default tool supplied by React. This is the tool used for the first six
months of the project.

As of November 2022, create-react-app has numerous (minor but annoying) problems.

1. Slow build tool - written in Javascript
2. Glacial pace of development - releases only made once or twice a year. Whilst stability
   is not itself a problem, other innovations in this space seem to be running well ahead
   of CRA
3. Tends to not have much configurability without 'ejecting' out of the environment. Given
   our needs are reasonably sophisticated (and we have experienced developers) - we would
   like to have the ability to alter _some_ settings. We don't however want to 'eject' as
   as that puts all maintenance going forward on us.

Looking into this space, some options investigated were

- Next.js https://nextjs.org/
- Vite https://vitejs.dev/
- webpack https://webpack.js.org/, esbuild, rollup

Next.js is relatively exciting and has a brand new custom bundling tool (as of v 13). It however
is also opinionated about various aspects such as routing, SSR etc. Converting the project
to Next.js would be a big step, and one not particularly needed right now. This should
be revisited once Next.js 13 is more settled.

Vite seems fast, configurable and does the job required. At some level it is a tool that
lives _above_ the other tools such as esbuild and rollup.

## Decision

Decided on converting to Vite in the short term and to revisit in 6 months.

## Consequences

Other than some minor issues with some (poorly written) packages being incompatible
with the Vite bundler - there has been no major changes required. Those packages
will need to be replaced with ones that are compatible.

Nothing about this decision prevents us from pivoting to Next.js (or any other bundler)
in the future. 99% of the React code of the project did not change in the conversion
from CRA to Vite.
