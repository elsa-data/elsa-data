/**
 * The following are the items that are passed through to the
 * compiler of the index.html template.
 */
export type IndexHtmlTemplateData = { [k: string]: string };

export function getMandatoryEnv(name: string): string {
  const val = process.env[name];

  if (!val)
    throw new Error(
      `Was expecting a mandatory environment variable named ${name} to exist, but it was missing or empty`
    );

  return val;
}
