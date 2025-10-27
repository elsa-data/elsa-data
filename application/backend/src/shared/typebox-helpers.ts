import Type from "typebox";

export const DateKind = Symbol("DateKind");
export interface TDate extends Type.TSchema {
  type: "string";
  $static: Date;
  kind: typeof DateKind;
}
export const TypeDate = Type.String({ format: "date-time" }) as
  | Type.TString
  | TDate;

export type IntoStringUnion<T> = {
  [K in keyof T]: T[K] extends string ? Type.TLiteral<T[K]> : never;
};

export function StringUnion<T extends string[]>(
  values: [...T],
): Type.TUnion<IntoStringUnion<T>> {
  return { enum: values } as any;
}

export const Nullable = <T extends Type.TSchema>(schema: T) =>
  Type.Union([schema, Type.Null()]);
