import React, { useRef, useState } from "react";
import { SelectDialogBase } from "./select-dialog-base";

type Props = {
  openButtonLabel: string;
  openButtonClassName: string;
  onConfirmButtonLabel: string;
  dialogTitle: string;
  dialogContent: string;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  openButtonLabel,
  openButtonClassName,
  onConfirmButtonLabel,
  dialogTitle,
  dialogContent,
  onConfirm,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // A function when dialog is closed
  const cancelButtonRef = useRef(null);
  const cancelButton = () => {
    setIsDialogOpen(false);
  };

  const onConfirmClick = () => {
    onConfirm();
    cancelButton();
  };

  return (
    <>
      <button
        className={openButtonClassName}
        onClick={() => setIsDialogOpen((p) => !p)}
      >
        {openButtonLabel}
      </button>
      <SelectDialogBase
        showing={isDialogOpen}
        cancelShowing={cancelButton}
        title={dialogTitle}
        buttons={
          <>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                onConfirmClick();
              }}
            >
              {onConfirmButtonLabel}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={cancelButton}
              ref={cancelButtonRef}
            >
              Cancel
            </button>
          </>
        }
        content={
          <>
            <div className="prose mt-4">
              <p className="text-sm text-gray-500">{dialogContent}</p>
            </div>
          </>
        }
        initialFocus={cancelButtonRef}
      />
    </>
  );
}
