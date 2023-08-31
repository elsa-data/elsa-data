import React from "react";

type UserProps = {
  displayName: string;
  email: string;
  subjectIdentifier: string;
};

export const DisplayUserInformation = ({
  className,
  user,
}: {
  className?: string;
  user: Partial<UserProps>;
}) => (
  <div className={className}>
    {user.displayName && (
      <div className="mt-1">
        <label className="label">
          <span className="label-text text-sm font-medium">{`Name`}</span>
        </label>
        <input
          value={user.displayName}
          type="text"
          className="input-bordered input input-sm !m-0 w-full "
          disabled
        />
      </div>
    )}

    {user.email && (
      <div className="mt-1">
        <label className="label">
          <span className="label-text text-sm font-medium">{`Email`}</span>
        </label>
        <input
          value={user.email}
          type="text"
          className="input-bordered input input-sm !m-0 w-full "
          disabled
        />
      </div>
    )}

    {user.subjectIdentifier && (
      <div className="mt-1">
        <label className="label">
          <span className="label-text text-sm font-medium">{`Subject Identifier`}</span>
        </label>
        <input
          value={user.subjectIdentifier}
          type="text"
          className="input-bordered input input-sm !m-0 w-full "
          disabled
        />
      </div>
    )}
  </div>
);
