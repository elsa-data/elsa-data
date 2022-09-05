import React, { PropsWithChildren, useId } from "react";
import { rhInputClassName } from "./common-styles";

type Props = { label: string; extra?: string } & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

/**
 */
export const RhInput = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    // generate unique ID
    const id = useId();

    return (
      <div className="col-span-6 sm:col-span-3">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
        <div className="mt-1">
          <input
            type="text"
            id={id}
            ref={ref}
            className={rhInputClassName}
            {...props}
          />
        </div>
        {props.extra && (
          <p className="mt-2 text-sm text-gray-500">{props.extra}</p>
        )}
      </div>
    );
  },
);
