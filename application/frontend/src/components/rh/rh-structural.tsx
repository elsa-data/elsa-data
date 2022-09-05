import React, { PropsWithChildren, useId } from "react";

export const RhSection: React.FC<PropsWithChildren<{}>> = (props) => {
  return (
    <div className="md:grid md:grid-cols-5 md:gap-6">{props.children}</div>
  );
};

export const HrDiv: React.FC = () => {
  return (
    <div className="hidden sm:block" aria-hidden="true">
      <div className="py-5">
        <div className="border-t border-gray-200" />
      </div>
    </div>
  );
};

export const LeftDiv: React.FC<{ heading: string; extra?: string }> = (
  props
) => {
  return (
    <div className="md:col-span-1">
      <div className="px-4 sm:px-0">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {props.heading}
        </h3>
        {props.extra && (
          <p className="mt-1 text-sm text-gray-600">{props.extra}</p>
        )}
      </div>
    </div>
  );
};

export const RightDiv: React.FC<PropsWithChildren<{}>> = (props) => {
  return <div className="mt-5 md:mt-0 md:col-span-4">{props.children}</div>;
};
