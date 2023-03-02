import React, { useState } from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import {
  REACT_QUERY_RELEASE_KEYS,
  specificReleaseParticipantsQuery,
  specificReleaseQuery,
} from "../detail/queries";
import { ReleaseTypeLocal } from "../detail/shared-types";
import { EagerErrorBoundary, ErrorState } from "../../../components/errors";
import { ReleasesBreadcrumbsDiv } from "../releases-breadcrumbs-div";
import { Box, BoxNoPad } from "../../../components/boxes";
import { ReleaseParticipantType } from "@umccr/elsa-types";
import { IsLoadingDiv } from "../../../components/is-loading-div";
import classNames from "classnames";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";

/**
 */
export const ReleasesUserManagementPage: React.FC = () => {
  const { releaseId } = useParams<{ releaseId: string }>();

  if (!releaseId)
    throw new Error(
      `The component ReleasesUserManagementPage cannot be rendered outside a route with a releaseId param`
    );

  const [error, setError] = useState<ErrorState>({
    error: null,
    isSuccess: true,
  });

  const releaseParticipantsQuery = useQuery<ReleaseParticipantType[]>({
    queryKey: REACT_QUERY_RELEASE_KEYS.participant(releaseId),
    queryFn: specificReleaseParticipantsQuery,
    onError: (error: any) => setError({ error, isSuccess: false }),
    onSuccess: (_: any) => setError({ error: null, isSuccess: true }),
  });

  const baseColumnClasses = ["p-4", "font-medium", "text-gray-500"];

  const baseMessageDivClasses =
    "min-h-[10em] w-full flex items-center justify-center";

  const columnProps = [
    {
      columnTitle: "Email",
    },
    {
      columnTitle: "Name",
    },
    {
      columnTitle: "Subject Id",
    },
    {
      columnTitle: "Role",
    },
    {
      columnTitle: "Last Login",
    },
  ];

  return (
    <div className="mt-2 flex flex-grow flex-row flex-wrap">
      <>
        <ReleasesBreadcrumbsDiv releaseId={releaseId} />

        {releaseParticipantsQuery.isSuccess && (
          <>
            <BoxNoPad heading="User Management">
              <div className="flex flex-col overflow-auto">
                {releaseParticipantsQuery.isLoading && <IsLoadingDiv />}
                {releaseParticipantsQuery.data &&
                  releaseParticipantsQuery.data.length === 0 && (
                    <div className={classNames(baseMessageDivClasses)}>
                      <p>There are no visible dataset(s)</p>
                    </div>
                  )}
                {releaseParticipantsQuery.data &&
                  releaseParticipantsQuery.data.length > 0 && (
                    <table className="w-full table-auto text-left text-sm text-gray-500">
                      <tbody>
                        {/* Column Title */}
                        <tr>
                          {columnProps.map((props, idx) => (
                            <td
                              key={idx}
                              className={classNames(
                                baseColumnClasses,
                                "font-semibold",
                                "border-b"
                              )}
                            >
                              {props.columnTitle}
                            </td>
                          ))}
                        </tr>

                        {releaseParticipantsQuery.data.map((row, rowIndex) => {
                          return (
                            <tr
                              key={row.id}
                              className="cursor-pointer border-b hover:bg-gray-50"
                            >
                              <td
                                className={classNames(
                                  baseColumnClasses,
                                  "text-left"
                                )}
                              >
                                {row.email}
                              </td>
                              <td
                                className={classNames(
                                  baseColumnClasses,
                                  "text-left"
                                )}
                              >
                                {row.displayName}
                              </td>
                              <td
                                className={classNames(
                                  baseColumnClasses,
                                  "text-left"
                                )}
                              >
                                {row.subjectId}
                              </td>
                              <td
                                className={classNames(
                                  baseColumnClasses,
                                  "text-left"
                                )}
                              >
                                {row.role}
                              </td>
                              <td
                                className={classNames(
                                  baseColumnClasses,
                                  "text-left"
                                )}
                              >
                                {row.lastLogin
                                  ? formatLocalDateTime(row.lastLogin)
                                  : ""}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
              </div>
            </BoxNoPad>
          </>
        )}
        {!error.isSuccess && (
          <EagerErrorBoundary
            message={"Something went wrong fetching release data."}
            error={error.error}
            styling={"bg-red-100"}
          />
        )}
      </>
    </div>
  );
};
