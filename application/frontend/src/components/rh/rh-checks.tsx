import React, { PropsWithChildren, useId } from "react";
import classNames from "classnames";

type Props = {
  label: string;
  extra?: string;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

export const RhCheckItem = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    const id = useId();

    return (
      <div className={classNames(props.className, "flex", "items-start")}>
        <div className="flex h-5 items-center">
          <input
            id={id}
            ref={ref}
            {...props}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={id} className="font-medium text-gray-700">
            {props.label}
          </label>
          {props.extra && <p className="text-gray-500">{props.extra}</p>}
        </div>
      </div>
    );
  }
);

/**
 */
export const RhChecks: React.FC<
  PropsWithChildren<{ label: string }> &
    React.HTMLAttributes<HTMLFieldSetElement>
> = ({ label, children, className }) => {
  return (
    <fieldset className={className}>
      <legend className="sr-only">{label}</legend>
      <div className="text-base font-medium text-gray-900" aria-hidden="true">
        {label}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
};

{
  /*
      <div className="col-span-6 sm:col-span-3">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
        <select
          id={id}
          ref={ref}
          {...props}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {props.options.map(({ label, value }) => (
            <option value={value}>{label}</option>
          ))}
        </select>
        {props.extra && (
          <p className="mt-2 text-sm text-gray-500">{props.extra}</p>
        )}
      </div>
      */
}
