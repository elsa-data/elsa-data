import React, { useState } from "react";
import { Box } from "../../components/boxes";
import { VerticalTabs } from "../../components/vertical-tabs";
import { ReleasesAddReleaseDialog } from "./rems-dac/releases-dashboard-add-release-dialog";
import { ReleasesManualEntryDialog } from "./manual/releases-dashboard-manual-entry-dialog";
import { AustralianGenomicsDacRedcapUploadDiv } from "./australian-genomics-dac-redcap/australian-genomics-dac-redcap-upload-div";
import { trpc } from "../../helpers/trpc";

/**
 * A dashboard showing the available upstream DAC stacks from which we can source
 * applications to create new releases.
 *
 * @constructor
 */
export const DacDashboardPage: React.FC = () => {
  const [showingRemsDialog, setShowingRemsDialog] = useState(false);
  const [showingManualEntryDialog, setShowingManualEntryDialog] =
    useState(false);

  // the backend tells us all the DAC UI boxes we need to display
  // NOTE this query will fail if we do not have ALLOWED_CREATE_NEW_RELEASE - but this page
  // should never appear for people without that permission
  const dacQuery = trpc.dac.getDacInstances.useQuery();

  return (
    <>
      {dacQuery.isSuccess && (
        <>
          <Box
            heading="DAC"
            errorMessage={"Something went wrong loading DAC instances"}
          >
            <VerticalTabs tabHeadings={dacQuery.data.map((a) => a.description)}>
              {dacQuery.data.map((a) => {
                if (a.type === "rems")
                  return (
                    <div className="flex flex-col gap-6">
                      <div className="prose">
                        <label className="block">
                          <span className="text-xs font-bold uppercase text-gray-700">
                            REMS Instance URL
                          </span>
                          <input
                            type="text"
                            defaultValue={a.url}
                            className="mt-1 block w-full rounded-md border-transparent bg-gray-50 focus:border-gray-500 focus:bg-white focus:ring-0"
                          />
                        </label>
                        <button
                          className="btn-normal"
                          onClick={() => setShowingRemsDialog(true)}
                        >
                          Find New Applications
                        </button>
                      </div>
                    </div>
                  );

                if (a.type === "manual")
                  return (
                    <button
                      className="btn-normal"
                      onClick={() => setShowingManualEntryDialog(true)}
                    >
                      Create Release Manually
                    </button>
                  );

                if (
                  a.type === "redcap-australian-genomics-csv" ||
                  a.type === "redcap-australian-genomics-demo-csv"
                )
                  return <AustralianGenomicsDacRedcapUploadDiv />;
              })}
            </VerticalTabs>
          </Box>
          {dacQuery.data.map((a) => {
            if (a.type === "rems")
              return (
                <ReleasesAddReleaseDialog
                  showing={showingRemsDialog}
                  cancelShowing={() => setShowingRemsDialog(false)}
                />
              );

            if (a.type === "manual")
              return (
                <ReleasesManualEntryDialog
                  showing={showingManualEntryDialog}
                  cancelShowing={() => setShowingManualEntryDialog(false)}
                />
              );
          })}
        </>
      )}
    </>
  );
};
