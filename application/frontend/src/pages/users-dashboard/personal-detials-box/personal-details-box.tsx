import React from "react";
import { Box } from "../../../components/boxes";
import { useCookies } from "react-cookie";
import {
  ALLOWED_CHANGE_USER_PERMISSION,
  ALLOWED_CREATE_NEW_RELEASES,
  ALLOWED_VIEW_ELSA_ADMIN_VIEW,
  USER_EMAIL_COOKIE_NAME,
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
    case ALLOWED_CHANGE_USER_PERMISSION:
      return "Change admins";
    case ALLOWED_CREATE_NEW_RELEASES:
      return "Create new releases";
    case ALLOWED_VIEW_ELSA_ADMIN_VIEW:
      return "Allowed view all audits";
    default:
      return `Unknown 'allowed' with code ${allowed}`;
  }
}

export const PersonalDetailsBox: React.FC<Props> = ({}) => {
  const [cookies] = useCookies<any>([
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
    USER_EMAIL_COOKIE_NAME,
  ]);

  // we could also make an API endpoint - and return back information that only the server
  // has "about you".. things like "here are all the releases you are involved with"..
  const uiAllowed = useUiAllowed();

  return (
    <Box heading="Basic Info">
      <div className="flex w-full flex-col lg:flex-row">
        <div className="card rounded-box grid flex-grow">
          <h3 className="font-medium">Name</h3>
          <p>{cookies[USER_NAME_COOKIE_NAME]}</p>
          <br />

          <h3 className="font-medium">Email</h3>
          <p>{cookies[USER_EMAIL_COOKIE_NAME]}</p>
          <br />

          <h3 className="font-medium">Subject Identifier</h3>
          <p>{cookies[USER_SUBJECT_COOKIE_NAME]}</p>
        </div>
        <div className="divider divider-vertical lg:divider-horizontal" />
        <div className="card rounded-box grid flex-grow">
          <h3 className="font-medium">Permission Granted for this account</h3>
          <ul className="list-inside list-disc">
            {Array.from(uiAllowed.values()).map((v) => (
              <li className="mt-2" key={v}>
                {debugAllowedDescription(v)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Box>
  );
};
