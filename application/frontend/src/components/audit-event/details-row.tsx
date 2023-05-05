import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AuditEventDetailsType } from "@umccr/elsa-types";
import { EagerErrorBoundary } from "../errors";
import React from "react";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";

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
   * The id of the audit event.
   */
  objectId: string;
};

/**
 * The details row shown when clicking on a row in an audit event table.
 */
export const DetailsRow = ({ objectId }: DetailsRowProps): JSX.Element => {
  const navigate = useNavigate();

  const detailsQuery = useQuery(
    [`audit-event-details`, objectId],
    async () => {
      return await axios
        .get<AuditEventDetailsType | null>(
          `/api/audit-event/truncated-details?id=${objectId}&start=0&end=${MAXIMUM_DETAIL_LENGTH}`
        )
        .then((response) => response.data);
    },
    { keepPreviousData: true }
  );

  // TODO make a link here to a full details page
  // if we decide it is worth it (and that's a big if)
  // this is where somehow we'd put a button taking us to the audit entry full details page
  //           <button
  //               id={`button-view-${objectId}`}
  //               className={classNames("btn-table-action-navigate")}
  //               onClick={async () => {
  //                 // TODO make this work whether top level page or subpage
  //                 navigate(`${objectId}`);
  //               }}
  //           >
  //             detail
  //           </button>
  // AT THE MOMENT - NO AUDIT ENTRIES WOULD EVER BE TRUNCATED SO NOT MUCH POINT YET

  return detailsQuery.isSuccess && detailsQuery.data?.details ? (
    <div className="whitespace-pre-wrap font-mono text-xs">
      {detailsQuery.data.details}
      {detailsQuery.data.truncated ? (
        <div className="whitespace-pre-wrap pl-8 pt-2 font-bold italic text-gray-400">
          ...
        </div>
      ) : (
        <></>
      )}
    </div>
  ) : detailsQuery.isError ? (
    <EagerErrorBoundary
      message={"Something went wrong displaying audit event details."}
      error={detailsQuery.error}
      styling={"bg-red-100"}
    />
  ) : (
    <></>
  );
};
