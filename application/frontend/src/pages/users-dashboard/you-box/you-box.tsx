import React from "react";
import { Box } from "../../../components/boxes";
import { useCookies } from "react-cookie";
import {
  ALLOWED_CHANGE_ADMINS,
  ALLOWED_CREATE_NEW_RELEASES,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { useUiAllowed } from "../../../hooks/ui-allowed";

type Props = {};

/**
 * An array that maps the above "allowed" flags into strings that can be printed.
 * Will be used purely for dev/debug purposes. Unless this is needed elsewhere it can live
 * permanently near the React that uses it.
 */
export function debugAllowedDescription(allowed: string) {
  switch (allowed) {
    case ALLOWED_CHANGE_ADMINS:
      return "change admins";
    case ALLOWED_CREATE_NEW_RELEASES:
      return "create new releases";
    default:
      return `unknown 'allowed' with code ${allowed}`;
  }
}

export const YouBox: React.FC<Props> = ({}) => {
  const [cookies] = useCookies<any>([
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
  ]);

  // we could also make an API endpoint - and return back information that only the server
  // has "about you".. things like "here are all the releases you are involved with"..

  const uiAllowed = useUiAllowed();

  return (
    <Box heading="You">
      <div className="flex flex-col space-y-1">
        <p className="prose">
          {cookies[USER_SUBJECT_COOKIE_NAME]}
          <br />
          {cookies[USER_NAME_COOKIE_NAME]}
        </p>
        <p className="prose">Last login XXXX</p>
        <p className="prose">
          The UI thinks the following features are allowed for this user
        </p>
        <ul>
          {Array.from(uiAllowed.values()).map((v) => (
            <li key={v}>{debugAllowedDescription(v)}</li>
          ))}
        </ul>
      </div>
    </Box>
  );
};
