import React, { Fragment, MutableRefObject, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ErrorBoundary } from "./error-display";

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

        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                    {content}
                  </div>
                </div>
                {errorMessage && <ErrorBoundary message={errorMessage} displayEagerly={true} />}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
