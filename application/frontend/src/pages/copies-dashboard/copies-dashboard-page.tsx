import React, { useEffect, useState } from "react";
import { Box } from "../../components/boxes";
import { trpc } from "../../helpers/trpc";
import { IsLoadingDiv } from "../../components/is-loading-div";

export const CopiesDashboardPage: React.FC = () => {
  const utils = trpc.useUtils();

  const {
    data: copyData,
    isSuccess: copyIsSuccess,
    isPending: copyIsPending,
  } = trpc.copyService.getCopied.useQuery();

  const [reportState, setReportState] = useState("");

  useEffect(() => {
    if (copyIsSuccess) {
    }
  }, [copyIsSuccess]);

  return (
    <>
      <Box heading="Copies">
        {copyIsPending && <IsLoadingDiv />}

        {copyIsSuccess && copyData && (
          <>
            <table className="table-auto">
              {copyData.map((x: any) => {
                return (
                  <tr>
                    <td
                      onClick={async () => {
                        const r = await utils.copyService.getCopiedReport.fetch(
                          {
                            executionArn: x.arn,
                          },
                        );
                        setReportState(r);
                      }}
                    >
                      {x.id}
                    </td>
                    <td>{x.status}</td>
                  </tr>
                );
              })}
            </table>
          </>
        )}
      </Box>
      <Box heading="Report">
        <pre>{JSON.stringify(reportState, null, 2)}</pre>
      </Box>
    </>
  );
};
