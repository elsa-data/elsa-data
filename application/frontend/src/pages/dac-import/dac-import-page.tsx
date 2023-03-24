import React, { useState } from "react";
import { Box } from "../../components/boxes";
import { VerticalTabs } from "../../components/vertical-tabs";
import { ReleasesAddReleaseDialog } from "./rems-dac/releases-dashboard-add-release-dialog";
import { ReleasesManualEntryDialog } from "./manual/releases-dashboard-manual-entry-dialog";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { ALLOWED_CREATE_NEW_RELEASE } from "@umccr/elsa-constants";
import { AustralianGenomicsDacRedcapUploadDiv } from "./australian-genomics-dac-redcap/australian-genomics-dac-redcap-upload-div";

export const DacImportPage: React.FC = () => {
  const [showingRemsDialog, setShowingRemsDialog] = useState(false);
  const [showingManualEntryDialog, setShowingManualEntryDialog] =
    useState(false);

  const uiAllowed = useUiAllowed();

  return (
    <div className="flex flex-row flex-wrap">
      {/* SYNCHRONISE DAC BOX */}
      {uiAllowed.has(ALLOWED_CREATE_NEW_RELEASE) && (
        <>
          <Box
            heading="Import from DAC"
            errorMessage={"Something went wrong importing from DAC."}
          >
            <VerticalTabs
              tabHeadings={[
                "REMS",
                "Australian Genomics Redcap",
                "Manual Entry",
              ]}
            >
              <div className="flex flex-col gap-6">
                <div className="prose">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-gray-700">
                      Instance URL
                    </span>
                    <input
                      type="text"
                      defaultValue="https://hgpp-rems.dev.umccr.org"
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
              <AustralianGenomicsDacRedcapUploadDiv />
              <button
                className="btn-normal"
                onClick={() => setShowingManualEntryDialog(true)}
              >
                Enter Release Details
              </button>
            </VerticalTabs>
          </Box>

          {/* Dialog component from buttons above */}
          <ReleasesAddReleaseDialog
            showing={showingRemsDialog}
            cancelShowing={() => setShowingRemsDialog(false)}
          />
          <ReleasesManualEntryDialog
            showing={showingManualEntryDialog}
            cancelShowing={() => setShowingManualEntryDialog(false)}
          />
        </>
      )}
    </div>
  );
};
