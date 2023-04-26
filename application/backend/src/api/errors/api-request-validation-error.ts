import { Base7807Error, Base7807Response } from "@umccr/elsa-types/error-types";
import { ErrorObject } from "ajv";

export class ApiRequestValidationError extends Base7807Error {
  constructor(private readonly errors: ErrorObject[]) {
    super("Validation Error", 400);
  }

  public toResponse(): Base7807Response {
    let singleLineDetail = "Validation failures were";

    // we want a single line detail message that a simple client could report (in a UI say) and that would be useful
    // so we concat the first two validation messages and then call it quits...

    if (this.errors.length > 0) {
      singleLineDetail += ` '${this.errors[0].message}'`;
    }

    if (this.errors.length > 1) {
      singleLineDetail += `, '${this.errors[1].message}'`;
    }

    if (this.errors.length > 2) {
      singleLineDetail += " and others..";
    }

    return {
      // todo: make this a URI
      type: "ApiRequestValidationError",
      title: this.message,
      status: this.status,
      detail: singleLineDetail,
      "validation-details": this.errors.map((eo) => {
        return {
          message: eo.message,
          field: eo.propertyName,
        };
      }),
    };
  }
}

/*
interface ErrorObject {
  keyword: string // validation keyword.
  instancePath: string // JSON Pointer to the location in the data instance (e.g., `"/prop/1/subProp"`).
  schemaPath: string // JSON Pointer to the location of the failing keyword in the schema
  params: object // type is defined by keyword value, see below
                 // params property is the object with the additional information about error
                 // it can be used to generate error messages
                 // (e.g., using [ajv-i18n](https://github.com/ajv-validator/ajv-i18n) package).
                 // See below for parameters set by all keywords.
  propertyName?: string // set for errors in `propertyNames` keyword schema.
                        // `instancePath` still points to the object in this case.
  message?: string // the error message (can be excluded with option `messages: false`).
  // Options below are added with `verbose` option:
  schema?: any // the value of the failing keyword in the schema.
  parentSchema?: object // the schema containing the keyword.
  data?: any // the data validated by the keyword.
}
 */
