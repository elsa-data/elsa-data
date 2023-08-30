import { UserPermissionType } from "@umccr/elsa-types/schemas-users";

export const CHANGE_USER_PERMISSION_DESC =
  "Allowed to change other user's permission.";
export const CREATE_NEW_RELEASE_DESC =
  "Allowed to create and become a release administrator.";
export const OVERALL_ADMIN_VIEW_DESC =
  "Allowed to view as an app administrator.";
export const DATASET_UPDATE_DESC = "Allowed to update/refresh dataset index.";

export const PERMISSION_OPTIONS: {
  key: UserPermissionType;
  disabled?: boolean;
  title: string;
  description?: string;
}[] = [
  {
    title: CREATE_NEW_RELEASE_DESC,
    key: "isAllowedCreateRelease",
  },
  {
    title: DATASET_UPDATE_DESC,
    key: "isAllowedRefreshDatasetIndex",
  },
  {
    title: OVERALL_ADMIN_VIEW_DESC,
    description:
      "Will be able to view all Datasets, Releases, and Audit Events.",
    key: "isAllowedOverallAdministratorView",
  },
  {
    title: CHANGE_USER_PERMISSION_DESC,
    description: "It can only be modified within the app configuration.",
    key: "isAllowedChangeUserPermission",
    disabled: true,
  },
];
