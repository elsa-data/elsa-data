import React, { Fragment, MutableRefObject, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { EagerErrorBoundary } from "./errors";
import { AiOutlineClose } from "react-icons/ai";

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
        as="div"
        className="relative z-10"
        initialFocus={initialFocus}
        onClose={cancelShowing}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative mx-4 transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <button
                  type="button"
                  className="absolute top-2 right-2 inline-flex justify-center rounded-md
                   border border-gray-300 bg-white px-3 py-3 text-base font-medium text-gray-700 shadow-sm
                   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => cancelShowing()}
                >
                  <AiOutlineClose />
                </button>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mt-3 text-center sm:mx-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                    {content}
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <EagerErrorBoundary
                      message={errorMessage}
                      styling={"bg-red-100"}
                    />
                  </div>
                )}

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {buttons}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
