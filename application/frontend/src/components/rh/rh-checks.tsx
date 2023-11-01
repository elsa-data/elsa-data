import React, { PropsWithChildren, ReactNode, useId } from "react";
import classNames from "classnames";

type Props = {
  label: ReactNode;
  inputClassName?: string;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

export const RhCheckItem = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    const id = useId();

    // take our two props that have special meanings for us out of the
    // general pass through props
    const { inputClassName, label, ...otherProps } = props;

    return (
      <div
        className={classNames(
          props.className,
          "form-control",
          "items-start",
          "space-x-2",
        )}
      >
        <label className="label cursor-pointer">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            {...otherProps}
            className={classNames(inputClassName, "checkbox checkbox-sm mr-2")}
          />
          <span className="label-text">{label}</span>
        </label>
      </div>
    );
  },
);

/**
 */
export const RhChecks: React.FC<
  PropsWithChildren<{ label: string; inputClassName?: string }> &
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

export const RhChecksDetail: React.FC<
  PropsWithChildren<{ enabled: boolean; inputClassName?: string }> &
    React.HTMLAttributes<HTMLFieldSetElement>
> = ({ enabled, children, className }) => {
  return (
    <div className={classNames("flex w-full flex-row")}>
      <div
        className={classNames(
          "ml-4 w-12 border-l-4",
          enabled ? "border-green-500" : "border-gray-500",
        )}
      ></div>
      {children}
    </div>
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
