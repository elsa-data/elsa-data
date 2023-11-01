export * from "./constants-cookies";
export * from "./constants-features";

export function isDiscriminate<
  K extends PropertyKey,
  V extends string | number | boolean,
>(discriminantKey: K, discriminantValue: V | V[]) {
  return <T extends Record<K, any>>(
    obj: T & Record<K, V extends T[K] ? T[K] : V>,
  ): obj is Extract<T, Record<K, V>> =>
    Array.isArray(discriminantValue)
      ? discriminantValue.some((v) => obj[discriminantKey] === v)
      : obj[discriminantKey] === discriminantValue;
}

export function isNotDiscriminate<
  K extends PropertyKey,
  V extends string | number | boolean,
>(discriminantKey: K, discriminantValue: V | V[]) {
  return <T extends Record<K, any>>(
    obj: T & Record<K, V extends T[K] ? T[K] : V>,
  ): obj is Exclude<T, Record<K, V>> =>
    Array.isArray(discriminantValue)
      ? discriminantValue.some((v) => obj[discriminantKey] === v)
      : obj[discriminantKey] === discriminantValue;
}
