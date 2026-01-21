import React from "react";
import { Box } from "../../components/boxes";
import { IsLoadingDiv } from "../../components/is-loading-div";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import { useTRPC } from "../../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";

export const CopiesDashboardPage: React.FC = () => {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const getCopiedQueryOptions = trpc.copyService.getCopied.queryOptions();
  const {
    data: copyData,
    isSuccess: copyIsSuccess,
    isPending: copyIsPending,
  } = useQuery(getCopiedQueryOptions);

  return (
    <>
      <Box heading="Copies">
        {copyIsPending && <IsLoadingDiv />}

        {copyIsSuccess && copyData && (
          <>
            <table className="table w-full table-auto">
              <tbody>
                {copyData.map((x: any) => {
                  return (
                    <tr>
                      <td>{x.id}</td>
                      <td>{x.status}</td>
                      <td className="text-right">
                        <button
                          className={classNames("btn-table-action-navigate")}
                          onClick={async () => {
                            navigate(encodeURIComponent(x.arn));
                          }}
                        >
                          view
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </Box>
    </>
  );
};
