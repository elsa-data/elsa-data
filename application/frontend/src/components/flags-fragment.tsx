import { hasFlag } from "country-flag-icons";
import getUnicodeFlagIcon from "country-flag-icons/unicode";
import React from "react";

type FlagsProps = {
  regions: string[];
};

/**
 * A React fragment representing a list of flags for regions.
 *
 * @param regions a list of ISO 2-letter country codes
 * @constructor
 */
export const FlagsFragment: React.FC<FlagsProps> = ({ regions }) => {
  if (regions.length === 0) {
    return <></>;
  } else
    return (
      <>
        (
        <ul className="inline-list comma-list">
          {regions.map((region, idx) => (
            <li key={`region-${idx}`}>
              <span title={region}>
                {hasFlag(region) ? getUnicodeFlagIcon(region) : `(${region})`}
              </span>
            </li>
          ))}
        </ul>
        )
      </>
    );
};
