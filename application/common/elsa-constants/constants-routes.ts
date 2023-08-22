export const NOT_AUTHORISED_ROUTE_PART = "not-authorised";

export const NO_SUBJECT_ID_ROUTE_PART = "missing-subject-id";

export const NO_EMAIL_OR_NAME_ROUTE_PART = "missing-name-or-email";

// an error has occurred in the backend doing the OIDC flow - we have logged specific details
// of the error, but we want to redirect to a page informing the user (with no details)
export const FLOW_FAIL_ROUTE_PART = "flow-fail";

export const DATABASE_FAIL_ROUTE_PART = "database-fail";
