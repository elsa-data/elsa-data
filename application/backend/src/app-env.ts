export function getMandatoryEnv(name: string): string {
  const val = process.env[name];

  if (!val)
    throw new Error(
      `Was expecting a mandatory environment variable named ${name} to exist, but it was missing or empty`
    );

  return val;
}
