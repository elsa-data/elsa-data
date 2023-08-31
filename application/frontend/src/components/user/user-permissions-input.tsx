import React from "react";
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

export const convertUserPropToPermissionState = (u: PermissionProps) => ({
  isAllowedChangeUserPermission: u.isAllowedChangeUserPermission,
  isAllowedRefreshDatasetIndex: u.isAllowedRefreshDatasetIndex,
  isAllowedCreateRelease: u.isAllowedCreateRelease,
  isAllowedOverallAdministratorView: u.isAllowedOverallAdministratorView,
});

type PermissionProps = {
  isAllowedChangeUserPermission: boolean;
  isAllowedCreateRelease: boolean;
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedOverallAdministratorView: boolean;
};

export const UserPermissionsInput = ({
  isDisabled,
  permissionProps,
  onPermissionChange,
}: {
  isDisabled: boolean;
  permissionProps: PermissionProps;
  onPermissionChange: (p: Partial<PermissionProps>) => void;
}) => (
  <>
    {PERMISSION_OPTIONS.map((o, index) => {
      const disabledClassName = (o.disabled || isDisabled) && "!text-gray-500";

      return (
        <label
          key={index}
          className={`my-2 flex content-center items-center pl-2 text-left text-gray-800 ${disabledClassName}`}
        >
          <input
            disabled={o.disabled || isDisabled}
            className="checkbox checkbox-sm mr-2 h-3 w-3 cursor-pointer rounded-sm"
            type="checkbox"
            value={o.key}
            checked={permissionProps[o.key]}
            onChange={(e) => {
              const key = e.target.value as UserPermissionType;
              onPermissionChange({ [key]: e.target.checked });
            }}
          />
          <div className="text-sm">
            <div className="font-medium">{o.title}</div>
            {o.description && (
              <div className="text-xs text-gray-500">{o.description}</div>
            )}
          </div>
        </label>
      );
    })}
  </>
);
