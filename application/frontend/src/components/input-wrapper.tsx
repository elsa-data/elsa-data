import React from "react";

/**
 * This function is aim to recursively to put disabled props if it doesn't allow to edit
 */
type Props = {
  children: React.ReactElement;
  isDisabledChildrenInput: boolean;
};
export const InputWrapper = ({ children, isDisabledChildrenInput }: Props) => {
  const disableInputs = (element: React.ReactElement) => {
    if (element && element.props) {
      const { children } = element.props;
      const newProps = { ...element.props, disabled: isDisabledChildrenInput };

      if (children) {
        newProps.children = React.Children.map(children, (child) =>
          disableInputs(child)
        );
      }

      return React.cloneElement(element, newProps);
    }

    return element;
  };

  const disabledChildren = React.Children.map(children, (child) =>
    disableInputs(child)
  );

  return <>{disabledChildren}</>;
};
