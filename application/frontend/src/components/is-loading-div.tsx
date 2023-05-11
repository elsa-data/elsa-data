import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSnowflake } from "@fortawesome/free-regular-svg-icons";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

/**
 * A full width, some height dev showing a loading message
 */
export const IsLoadingDiv = () => {
  return (
    <div className="flex min-h-[10em] w-full flex-col items-center justify-center gap-8">
      <IsLoadingDivIcon size="3x" />
      Loading...
    </div>
  );
};

/**
 * The actual icon used in our loading message div - but available here for special
 * locations and able to be sized.
 *
 * @param size
 * @constructor
 */
export const IsLoadingDivIcon: React.FC<{ size: SizeProp }> = ({ size }) => {
  return (
    <FontAwesomeIcon
      icon={faSnowflake}
      size={size}
      spin={true}
      color="#93c5fd"
    />
  );
};
