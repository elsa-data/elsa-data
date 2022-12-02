// the base Javascript Error interface has
// interface Error {
//     name: string;
//     message: string;
//     stack?: string;
// }

// we are interested in introducing a proper RFC 7807 system so will re-use those standard error fields
// where possible - but renaming them into the response JSON

/*
A problem details object can have the following members:

   o  "type" (string) - A URI reference [RFC3986] that identifies the
      problem type.  This specification encourages that, when
      dereferenced, it provide human-readable documentation for the
      problem type (e.g., using HTML [W3C.REC-html5-20141028]).  When
      this member is not present, its value is assumed to be
      "about:blank".

   o  "title" (string) - A short, human-readable summary of the problem
      type.  It SHOULD NOT change from occurrence to occurrence of the
      problem, except for purposes of localization (e.g., using
      proactive content negotiation; see [RFC7231], Section 3.4).

   o  "status" (number) - The HTTP status code ([RFC7231], Section 6)
      generated by the origin server for this occurrence of the problem.

   o  "detail" (string) - A human-readable explanation specific to this
      occurrence of the problem.

   o  "instance" (string) - A URI reference that identifies the specific
      occurrence of the problem.  It may or may not yield further
      information if dereferenced.
 */

export const BASE_7807_ABOUT_BLANK = "about:blank";

export interface Base7807Response {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;

  // we leave the interface open for extension
  [x: string | number | symbol]: unknown;
}

export class Base7807Error extends Error {
  constructor(
    title: string,
    public status: number,
    public detail?: string,
    public instance?: string
  ) {
    super();
    this.name = this.constructor.name;
    this.message = title;
  }

  public toResponse(): Base7807Response {
    return {
      type: BASE_7807_ABOUT_BLANK,
      title: this.message,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
    };
  }

  public static isBase7807Error(object: any): object is Base7807Response {
    return "type" in object && "title" in object && "status" in object;
  }
}
