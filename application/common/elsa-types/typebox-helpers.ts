import { TLiteral, TSchema, TString, TUnion, Type } from "@sinclair/typebox";

// @ts-ignore
export const DateKind = Symbol("DateKind");
export interface TDate extends TSchema {
  type: "string";
  $static: Date;
  kind: typeof DateKind;
}
export const TypeDate = Type.String({ format: "date-time" }) as TString | TDate;

export type IntoStringUnion<T> = {
  [K in keyof T]: T[K] extends string ? TLiteral<T[K]> : never;
};

export function StringUnion<T extends string[]>(
  values: [...T],
): TUnion<IntoStringUnion<T>> {
  return { enum: values } as any;
}
