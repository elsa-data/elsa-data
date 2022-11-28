import React, { useState } from "react";
import { Box } from "../../components/boxes";
import { LayoutBase } from "../../layouts/layout-base";
import { VerticalTabs } from "../../components/vertical-tabs";
import { ReleasesAddReleaseDialog } from "./rems-dac/releases-dashboard-add-release-dialog";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { ALLOWED_CREATE_NEW_RELEASES } from "@umccr/elsa-constants";
import { AustralianGenomicsDacRedcapUploadDiv } from "./australian-genomics-dac-redcap/australian-genomics-dac-redcap-upload-div";

export const DacImportPage: React.FC = () => {
  const [showingRemsDialog, setShowingRemsDialog] = useState(false);

  const uiAllowed = useUiAllowed();

  return (
    <LayoutBase>
      <div className="flex flex-row flex-wrap flex-grow mt-2">
        {/* SYNCHRONISE DAC BOX */}
        {uiAllowed.has(ALLOWED_CREATE_NEW_RELEASES) && (
          <Box heading="Import from DAC" errorMessage={"Something went wrong importing from DAC."}>
            <VerticalTabs tabHeadings={["REMS", "Australian Genomics Redcap"]}>
              <div className="flex flex-col gap-6">
                <div className="prose">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-700 uppercase">
                      Instance URL
                    </span>
                    <input
                      type="text"
                      defaultValue="https://hgpp-rems.dev.umccr.org"
                      className="mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
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
            </VerticalTabs>
          </Box>
        )}
      </div>
      <ReleasesAddReleaseDialog
        showing={showingRemsDialog}
        cancelShowing={() => setShowingRemsDialog(false)}
      />
    </LayoutBase>
  );
};
