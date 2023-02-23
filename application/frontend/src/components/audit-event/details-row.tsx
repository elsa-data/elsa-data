import { useQuery } from "react-query";
import axios from "axios";
import { AuditEventDetailsType } from "@umccr/elsa-types";
import { EagerErrorBoundary } from "../errors";
import React from "react";

/**
 * Maximum character length of details rendered in log box.
 */
// Allow this to be set somewhere?
export const MAXIMUM_DETAIL_LENGTH = 1000;

/**
 * Props for the details row.
 */
export type DetailsRowProps = {
  /**
   * The api path to use when displaying the details row.
   */
  path: string;
  /**
   * The id of the component in the path.
   */
  id: string;
  /**
   * The id of the audit event.
   */
  objectId: string;
};

/**
 * The details row shown when clicking on a row in an audit event table.
 */
export const DetailsRow = ({
  path,
  id,
  objectId,
}: DetailsRowProps): JSX.Element => {
  const detailsQuery = useQuery(
    [`${path}-audit-event-details`, objectId],
    async () => {
      return await axios
        .get<AuditEventDetailsType | null>(
          `/api/${path}/${id}/audit-event/details?id=${objectId}&start=0&end=${MAXIMUM_DETAIL_LENGTH}`
        )
        .then((response) => response.data);
    },
    { keepPreviousData: true }
  );

  return detailsQuery.isSuccess && detailsQuery.data?.details ? (
    <div className="whitespace-pre-wrap font-mono text-sm">
      {detailsQuery.data.details}
      {detailsQuery.data.truncated ? (
        <div className="whitespace-pre-wrap pl-8 pt-2 font-mono text-sm font-bold italic text-gray-400">
          ...
        </div>
      ) : (
        <></>
      )}
    </div>
  ) : detailsQuery.isError ? (
    <EagerErrorBoundary
      message={"Something went wrong displaying audit log details."}
      error={detailsQuery.error}
      styling={"bg-red-100"}
    />
  ) : (
    <></>
  );
};
