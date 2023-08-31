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
}) => (
  <>
    {/* The happy button (SAVE/SUCCESS/OK/INVITE) */}
    <button
      type="button"
      disabled={isSuccessDisabled}
      className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
      onClick={onSuccess}
    >
      {isLoading && <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />}
      {successButtonLabel}
    </button>

    {/* The cancellation button */}
    <button
      type="button"
      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
      onClick={onCancel}
      ref={cancelButtonRef}
    >
      {cancelButtonLabel}
    </button>
  </>
);
