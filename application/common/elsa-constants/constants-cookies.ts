export const SECURE_COOKIE_NAME = "elsa-data-id-and-bearer-tokens";

export const USER_SUBJECT_COOKIE_NAME = "elsa-data-logged-in-subject";
export const USER_NAME_COOKIE_NAME = "elsa-data-logged-in-name";
export const USER_EMAIL_COOKIE_NAME = "elsa-data-logged-in-email";

// the size to use in the absence of any set page size cookie
export const UI_PAGE_SIZE_DEFAULT = 10;

// the cookie we can set in browser to change the page size across the whole app
export const UI_PAGE_SIZE_COOKIE_NAME = "elsa-data-page-size";

// the allowed keys are passed down the UI in a cookie - and define what the logged in
// user is allowed to do in the UI.
// NOTE: the cookie is *not* the authorisation - the backend is still enforcing these
// rules on API calls based on real backend stuff
// we send these down to the front end as already worked out 'allowed' booleans
export const USER_ALLOWED_COOKIE_NAME = "elsa-data-logged-in-allowed";
