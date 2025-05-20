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
          <span className="label-text text-sm">{label}</span>
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
> = ({ label, children }) => {
  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
      <legend className="fieldset-legend">{label}</legend>

      <div className="flex flex-col space-y-2">{children}</div>
    </fieldset>
  );
};
