import React, { HTMLProps } from "react";
import classNames from "classnames";

/**
 * A checkbox that correctly handles an 'indeterminate' React property
 * and puts the underlying DOM checkbox into that state.
 *
 * @param indeterminate whether to set this checkbox to visually be indeterminate
 * @param className classnames for the checkbox
 * @param rest an other checkbox properties
 * @constructor
 */
export function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={classNames(className, "checkbox", "checkbox-sm")}
      {...rest}
    />
  );
}
