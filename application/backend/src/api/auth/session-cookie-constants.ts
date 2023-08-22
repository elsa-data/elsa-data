/**
 * The following constants are keys within our single SECURE_COOKIE_NAME
 * as managed by fastify session management.
 */
// NOT ENABLED UNTIL WE NEED THE BACKEND TO USE ACCESS TOKENS ON OUR BEHALF
// export const SESSION_TOKEN_PRIMARY = "cilogon_access_token";
export const SESSION_USER_DB_OBJECT_KEY_NAME = "user_db_object";

export const SESSION_OIDC_STATE_KEY_NAME = "state";
export const SESSION_OIDC_NONCE_KEY_NAME = "nonce";
