import React, { PropsWithChildren, useId } from "react";

type Props = {
  label: string;
  extra?: string;
} & React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

/**
 */
export const RhTextArea = React.forwardRef<HTMLTextAreaElement, Props>(
  (props, ref) => {
    // generate unique ID
    const id = useId();

    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
        <div className="mt-1">
          <textarea
            id={id}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
            {...props}
          />
        </div>
        {props.extra && (
          <p className="mt-2 text-sm text-gray-500">{props.extra}</p>
        )}
      </div>
    );
  }
);
