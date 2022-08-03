import { Static, Type } from "@sinclair/typebox";

export const TestingRequestSchema = Type.Object({
  // test of mandatory basic data types
  mandatoryString: Type.String(),
  mandatoryInteger: Type.Integer(),
  // test of optional basic data types
  optionalString: Type.Optional(Type.String()),
  optionalInteger: Type.Optional(Type.String()),
  // test of more advanced validations
  maxLengthString: Type.Optional(Type.String({ maxLength: 10 })),
});

export type TestingRequestType = Static<typeof TestingRequestSchema>;
