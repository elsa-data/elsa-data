import React, { useRef, useState } from "react";
import { SelectDialogBase } from "./select-dialog-base";
import { SuccessCancelButtons } from "./success-cancel-buttons";

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
          <SuccessCancelButtons
            isLoading={false}
            isSuccessDisabled={false}
            successButtonLabel={"Save"}
            onSuccess={onConfirmClick}
            cancelButtonLabel={"Cancel"}
            onCancel={cancelButton}
            cancelButtonRef={cancelButtonRef}
          />
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
