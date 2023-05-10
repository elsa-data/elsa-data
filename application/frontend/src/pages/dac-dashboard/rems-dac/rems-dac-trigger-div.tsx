import React, { useState } from "react";
import { RemsDacDialog } from "./rems-dac-dialog";

type Props = {
  dacId: string;
  dacRemsUrl: string;
};

export const RemsDacTriggerDiv: React.FC<Props> = ({ dacId, dacRemsUrl }) => {
  const [showingRemsDialog, setShowingRemsDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="prose">
          <label className="block">
            <span className="text-xs font-bold uppercase text-gray-700">
              REMS Instance URL
            </span>
          </label>
          <label className="block">
            <span className="font-mono text-xs text-gray-700">
              {dacRemsUrl}
            </span>
          </label>
          <button
            className="btn-standard-action-trigger-dialog"
            onClick={() => setShowingRemsDialog(true)}
          >
            Find New Applications
          </button>
        </div>
      </div>
      <RemsDacDialog
        showing={showingRemsDialog}
        cancelShowing={() => setShowingRemsDialog(false)}
      />
    </>
  );
};
