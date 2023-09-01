import React, { MutableRefObject } from "react";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const SuccessCancelButtons = ({
  isLoading,
  isSuccessDisabled,
  successButtonLabel,
  onSuccess,
  cancelButtonLabel,
  onCancel,
  cancelButtonRef,
}: {
  isLoading: boolean;
  isSuccessDisabled: boolean;
  successButtonLabel: string;
  onSuccess: () => void;
  cancelButtonLabel: string;
  onCancel: () => void;
  cancelButtonRef: MutableRefObject<null>;
}) => {
  // This class will make button full when small screen
  const defaultButtonClassName =
    " mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm";

  return (
    <>
      {/* The happy button (SAVE/SUCCESS/OK/INVITE) */}
      <button
        type="button"
        disabled={isSuccessDisabled}
        className={`btn-error btn bg-red-600 text-white shadow-sm hover:bg-red-700 ${defaultButtonClassName}`}
        onClick={onSuccess}
      >
        {isLoading && (
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
        )}
        {successButtonLabel}
      </button>

      {/* The cancellation button */}
      <button
        type="button"
        className={`btn-outline btn ${defaultButtonClassName}`}
        onClick={onCancel}
        ref={cancelButtonRef}
      >
        {cancelButtonLabel}
      </button>
    </>
  );
};
