import React from "react";
import { Box } from "../../components/boxes";
import { trpcOld } from "../../helpers/trpc-old.ts";
import { IsLoadingDiv } from "../../components/is-loading-div";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";

export const CopiesDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: copyData,
    isSuccess: copyIsSuccess,
    isPending: copyIsPending,
  } = trpcOld.copyService.getCopied.useQuery();

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
