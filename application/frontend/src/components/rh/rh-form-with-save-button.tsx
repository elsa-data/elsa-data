import React, { PropsWithChildren } from "react";
import {
  DeepPartial,
  SubmitHandler,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
} from "react-hook-form";

type Props<TFormValues> = {
  onSubmit: SubmitHandler<TFormValues>;
  methods: UseFormReturn<TFormValues>;
  children: (methods: UseFormReturn<TFormValues>) => React.ReactNode;
};

/**
 * A react-hook-form that contains other form inputs and a save button
 */
export const RhFormWithSaveButton = <TFormValues extends Record<string, any>>({
  onSubmit,
  methods,
  children,
}: Props<TFormValues>) => {
  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      <div className="shadow sm:rounded-md sm:overflow-hidden">
        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
          <div className="grid grid-cols-3 gap-6">{children(methods)}</div>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
};
