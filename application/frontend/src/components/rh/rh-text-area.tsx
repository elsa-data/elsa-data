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
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            {...props}
            ref={ref}
          />
        </div>
        {props.extra && (
          <p className="mt-2 text-sm text-gray-500">{props.extra}</p>
        )}
      </div>
    );
  },
);
