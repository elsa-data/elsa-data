import React from "react";

type Props = {
  field: string;
};

export const TsvColumnCheck: React.FC<Props> = ({ field }) => (
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      className="checkbox"
      defaultChecked={true}
      name="presignHeader"
      id={`chx-${field}`}
      value={field}
    />
    <label className="uppercase" htmlFor={`chx-${field}`}>
      {field}
    </label>
  </div>
);
