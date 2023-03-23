import { CSRF_TOKEN_COOKIE_NAME } from "@umccr/elsa-constants";
import React from "react";
import { useCookies } from "react-cookie";

/**
 * This is a simple a hidden "_csrf" input that will contain the csrf token.
 * This will be useful for <form> tag could include csrf token part of the request
 *
 * Ref: https://github.com/fastify/csrf-protection#fastifycsrfprotectionrequest-reply-next
 * @returns
 */

export const CSRFInputToken = () => {
  const [cookies, _setCookie, removeCookie] = useCookies<any>();
  return (
    <input type="hidden" name="_csrf" value={cookies[CSRF_TOKEN_COOKIE_NAME]} />
  );
};
