import React, { useEffect, useRef } from "react";

/**
 * This component is to put disabled props in all input, option, button, textarea
 * The `select` element is left out so option can still be viewed
 */
type Props = {
  children: React.ReactElement;
  isInputDisabled?: boolean;
};
export const DisabledInputWrapper = ({ children, isInputDisabled }: Props) => {
  const childrenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInputDisabled && childrenRef.current) {
      const inputElements: any = childrenRef.current.querySelectorAll(
        "input, option, button, textarea"
      );

      for (const inEl of inputElements) {
        inEl.disabled = true;
      }
    }
  }, [isInputDisabled, children]);

  return <div ref={childrenRef}>{children}</div>;
};
