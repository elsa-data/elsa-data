import React from "react";
import { Box } from "../../../components/boxes";
import { useCookies } from "react-cookie";
import {
  ALLOWED_CHANGE_USER_PERMISSION,
  ALLOWED_CREATE_NEW_RELEASE,
  ALLOWED_DATASET_UPDATE,
  ALLOWED_OVERALL_ADMIN_VIEW,
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { useUiAllowed } from "../../../hooks/ui-allowed";
import { PermissionDialog } from "../other-users/permission-dialog";

type Props = {};

export function decodeAllowedDescription(allowed: string) {
  switch (allowed) {
    case ALLOWED_CHANGE_USER_PERMISSION:
      return "Allowed to change other user's permission.";
    case ALLOWED_CREATE_NEW_RELEASE:
      return "Allowed to create and become a release administrator.";
    case ALLOWED_OVERALL_ADMIN_VIEW:
      return "Allowed to view as an app administrator.";
    case ALLOWED_DATASET_UPDATE:
      return "Allowed to update/refresh dataset index.";
    default:
      return `Unknown 'allowed' code ->${allowed}<-`;
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

  const userObject = {
    displayName: cookies[USER_NAME_COOKIE_NAME],
    email: cookies[USER_EMAIL_COOKIE_NAME],
    subjectIdentifier: cookies[USER_SUBJECT_COOKIE_NAME],
    isAllowedChangeUserPermission: uiAllowed.has(
      ALLOWED_CHANGE_USER_PERMISSION
    ),
    isAllowedCreateRelease: uiAllowed.has(ALLOWED_CREATE_NEW_RELEASE),
    isAllowedRefreshDatasetIndex: uiAllowed.has(ALLOWED_DATASET_UPDATE),
    isAllowedOverallAdministratorView: uiAllowed.has(
      ALLOWED_OVERALL_ADMIN_VIEW
    ),
  };

  const Heading = () => (
    <div className="flex">
      <div>Basic Info</div>
    </div>
  );

  return (
    <Box heading={<Heading />}>
      <div className="flex w-full flex-col sm:flex-row">
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
        <div className="divider divider-vertical sm:divider-horizontal" />
        <div className="card rounded-box flex-grow">
          <div className="flex">
            <h3 className="font-medium">Permissions</h3>
            <div>
              <PermissionDialog user={userObject} />
            </div>
          </div>
          <ul className="list-inside list-disc">
            {uiAllowed.size !== 0 ? (
              Array.from(uiAllowed.values()).map((v) => (
                <li className="mt-2" key={v}>
                  {decodeAllowedDescription(v)}
                </li>
              ))
            ) : (
              <li className="mt-2" key={"no permissions"}>
                No specific permissions.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Box>
  );
};
