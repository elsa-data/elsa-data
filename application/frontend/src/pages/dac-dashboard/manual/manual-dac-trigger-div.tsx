import React, { useState } from "react";
import { ManualDacDialog } from "./manual-dac-dialog";

type Props = {
  dacId: string;
};

export const ManualDacTriggerDiv: React.FC<Props> = ({ dacId }) => {
  const [showingManualEntryDialog, setShowingManualEntryDialog] =
    useState(false);

  return (
    <>
      <div className="prose">
        <p>
          Whilst the preference is for release to be created via upstream data
          access committee software (such as REMS) - releases can be created
          manually here.
        </p>
        <button
          className="btn-standard-action-trigger-dialog"
          onClick={() => setShowingManualEntryDialog(true)}
        >
          Create Release Manually...
        </button>
      </div>
      <ManualDacDialog
        showing={showingManualEntryDialog}
        cancelShowing={() => setShowingManualEntryDialog(false)}
      />
    </>
  );
};
