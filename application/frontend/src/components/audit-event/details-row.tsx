import { EagerErrorBoundary } from "../errors";
import { IsLoadingDivIcon } from "../is-loading-div";
import { useTRPC } from "../../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";

/**
 * Props for the details cas.
 */
export type DetailsRowProps = {
  /**
   * The id of the audit event.
   */
  objectId: string;
};

/**
 * The details cas shown when clicking on a cas in an audit event table.
 */
export const DetailsRow = ({ objectId }: DetailsRowProps): JSX.Element => {
  const trpc = useTRPC();

  const detailsQueryOptions = trpc.auditEvent.getAuditEventDetails.queryOptions(
    {
      id: objectId,
    },
  );
  const detailsQuery = useQuery(detailsQueryOptions);

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

  if (detailsQuery.isLoading)
    return (
      <div>
        <IsLoadingDivIcon size="1x" />
      </div>
    );

  if (detailsQuery.isSuccess && detailsQuery.data?.details)
    return (
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
    );

  if (detailsQuery.isError)
    return <EagerErrorBoundary error={detailsQuery.error} />;

  return <></>;
};
