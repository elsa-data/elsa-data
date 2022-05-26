import React, { PropsWithChildren } from "react";

type BoxProps = {
  heading: string;
};

export const Box: React.FC<PropsWithChildren<BoxProps>> = ({
  heading,
  children,
}) => {
  return (
    <div className="w-full p-3">
      <div className="bg-white border rounded shadow">
        <div className="border-b p-3">
          <h5 className="font-bold uppercase text-gray-600">{heading}</h5>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
