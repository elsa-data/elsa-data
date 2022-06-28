import React, { PropsWithChildren } from "react";

type Props = {
  label: string;
};

/**
 */
export const LabelledContent: React.FC<PropsWithChildren<Props>> = ({
  children,
  label,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="mt-1 flex flex-col rounded-md">{children}</div>
      </div>
    </div>
  );
};
