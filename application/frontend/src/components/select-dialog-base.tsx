import React, { Fragment, MutableRefObject, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { EagerErrorBoundary, OfflineAlert } from "./errors";
import { AiOutlineClose } from "react-icons/ai";
import classNames from "classnames";

type Props = {
  showing: boolean;
  cancelShowing: () => void;

  title: string;
  content: ReactNode;
  buttons: ReactNode;
  errorMessage?: string;

  initialFocus: MutableRefObject<null>;
};

export const SelectDialogBase: React.FC<Props> = ({
  showing,
  cancelShowing,
  title,
  content,
  buttons,
  errorMessage,
  initialFocus,
}) => {
  return (
    <Transition.Root show={showing} as={Fragment}>
      <Dialog
        className="relative z-50"
        initialFocus={initialFocus}
        onClose={cancelShowing}
      >
        {/* the backdrop, rendered as a fixed sibling to the panel container */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex w-screen items-center justify-center">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
            <div
              className={classNames(
                "border-b-4",
                "border-neutral-content",
                "border-solid",
                "p-4",
                "bg-neutral",
                "prose",
                "prose-base",
                "max-w-none",
              )}
            >
              <Dialog.Title as="h2" className="text-neutral-content">
                {title}
              </Dialog.Title>
            </div>

            {/* dialogs have an upper portion.. */}
            <div className={classNames("p-4", "bg-white")}>
              {errorMessage && (
                <EagerErrorBoundary error={new Error(errorMessage)} />
              )}

              {content}
            </div>

            {/* ...and a lower button section */}
            <div className="p-4 bg-gray-50 sm:flex sm:flex-row-reverse">
              {buttons}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
