import React, { useId } from "react";

type Props = {
  label: string;
  extra?: string;
  options: Option[];
} & React.DetailedHTMLProps<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
>;

type Option = {
  label: React.ReactNode;
  value: string | number | string[];
};

/**
 */
export const RhSelect = React.forwardRef<HTMLSelectElement, Props>(
  (props, ref) => {
    // generate unique ID
    const id = useId();

    return (
      <div className="col-span-6 sm:col-span-3">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
        <select
          id={id}
          ref={ref}
          {...props}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {props.options.map(({ label, value }) => (
            <option value={value}>{label}</option>
          ))}
        </select>
        {props.extra && (
          <p className="mt-2 text-sm text-gray-500">{props.extra}</p>
        )}
      </div>
    );
  },
);
