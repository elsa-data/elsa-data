# Configuration

Elsa Data has a rich configuration system that will cover all manner
of deployments.

At its core - a collection of JSON5 documents are sourced from a variety
of locations (including individual configuration fields sourced from
environment variables) and merged into a single combined JSON configuration document.

This configuration document then drives the behaviour of the deployed
Elsa Data system.

## Meta configuration

Elsa Data uses two environment variables to set up a _meta_ configuration
system. The meta systems job is to specify where the real configuration data
can be sourced and the order in which it should be sourced.

### `ELSA_DATA_META_CONFIG_FOLDERS`

An OS dependent (delimiter `;` or `:`) separated list of folders in which configuration files can be sourced.
Folder names can be absolute paths or relative to the starting directory of
the backend (i.e. the folder containing the backend `package.json`).

An example of this for Mac might be

`/Users/person/configs:./config`

which would instruct Elsa Data that configuration files can be found immediately
under the `/Users/person/configs` folder OR immediately under a `config`
folder located next to where Elsa Data is launched from.

### `ELSA_DATA_META_CONFIG_SOURCES`

A small mini language listing providers of configuration. Providers will generally
take a single string parameter allowing the source to be configured. For instance,
the `file` provider takes a portion of a filename that can be located in the configuration
folders.

An example meta config source string is

`file('base') file('dev-common') file('dev-localhost') file('datasets') osx-keychain('elsa-data')`

Read below for futher details of how each configuration source works.

#### File `file('name')`

JSON5 is sourced from a file in folders enabled via `ELSA_DATA_META_CONFIG_FOLDERS`. The name of the file
specified here as an argument CANNOT CONTAIN ANY SUFFIXES OR PATH NESTING. The `json5` file suffix
is implied. i.e. `file('fn')` -> a file named `fn.json5`

#### AWS Secret `aws-secret('name')`

JSON5 data is sourced from an AWS secret where name is the AWS secret prefix.

#### OS X Keychain `osx-keychain('name')`

Individual settings are sourced from an OS X keychain (this is a special non JSON config source).

#### Linux `linux-pass('name')`

TBD

#### GCP

TBD

## Array handling

Many parts of the configuration reside in arrays - but we want the ability to
manipulate these arrays _from separate configuration sources_. That is, we might
want to add a new configuration source that registers a completely new dataset, but
which doesn't alter any existing configured datasets.

This can be achieved by top level fields that start with `+` or `-`.

```json5
{
  // use the + notation to add into the existing datasets
  "+datasets": [
    {
      name: "datasetadd1",
      description: "A dataset sample added as 1",
      uri: "urn:elsa.net:2022:datasetadd1",
    },
    {
      name: "datasetadd2",
      description: "A dataset sample added as 2",
      uri: "urn:elsa.net:2022:datasetadd2",
    },
  ],
  // and use the - notation to remove an existing dataset
  // (by name but could also be by uri or id)
  "-datasets": ["dataset001"],
}
```

## JSON path handling

Some specific handling is needed where the secrets of an array need
to be split. In this case - we need to be able to precisely indicate
which array entry we are changing. We use a simplified JSON path
for this. Where JSON path occurs in a top-level field - it will be evaluated -
and where the path matches an existing simple field (string or number) -
the field will be replaced.

```json5
{
  dacs: [
    {
      id: "hgpp-rems",
      description: "A REMS instance for HGPP",
      key: "", // to be filled in via AWS secret
    },
  ],
}
```

And then putting the following into an AWS Secret config source.

```json5
{
  "$.dacs[?(@.id=='hgpp-rems')].key": "a-key",
}
```

## Environment variables

After all file loading is complete - individual settings can be replaced if a corresponding
environment variable exists. All environment variables for Elsa Data start with
`ELSA_DATA_CONFIG_`.

e.g. `ELSA_DATA_CONFIG_PORT` -> will set the port.
