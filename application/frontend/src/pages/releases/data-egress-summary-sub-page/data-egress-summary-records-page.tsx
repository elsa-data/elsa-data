import React, { useState } from "react";
import { Box } from "../../../components/boxes";
import { formatLocalDateTime } from "../../../helpers/datetime-helper";
import { redirect, useParams } from "react-router-dom";
import axios from "axios";
import { isNil } from "lodash";
import { BoxPaginator } from "../../../components/box-paginator";
import { usePageSizer } from "../../../hooks/page-sizer";
import { fileSize } from "humanize-plus";
import { EagerErrorBoundary } from "../../../components/errors";
import { trpc } from "../../../helpers/trpc";

export const DataAccessSummaryRecordsPage = () => {
  const { releaseKey } = useParams<{
    releaseKey: string;
  }>();

  const BoxHeader = () => (
    <div className="flex items-center	justify-between">
      <div>Data Access Records</div>
      <button
        onClick={async () =>
          await axios.post<any>(`/api/releases/${releaseKey}/access-log/sync`, {
            accessType: "aws",
          })
        }
        className="button cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-refresh mr-2 -ml-1 h-5 w-5"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#ffffff"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
        </svg>
        Sync (AWS)
      </button>
    </div>
  );

  return (
    <Box
      heading={<BoxHeader />}
      errorMessage={"Something went wrong fetching data access logs."}
    ></Box>
  );
};
