import React, { HTMLProps } from "react";
import classNames from "classnames";

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

  // if we are disabled we don't want the cursor pointer hover... and we want to be
  // a bit visually distinctive
  const cn = classNames(className, {
    "cursor-pointer": !rest.disabled,
    "opacity-50": rest.disabled,
  });

  return <input type="checkbox" ref={ref} className={cn} {...rest} />;
}
