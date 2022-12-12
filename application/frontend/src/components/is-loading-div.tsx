import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSnowflake } from "@fortawesome/free-regular-svg-icons";

/**
 * A full width, some height dev showing a loading message
 */
export const IsLoadingDiv = () => {
  return (
    <div className="flex min-h-[10em] w-full flex-col items-center justify-center gap-8">
      <FontAwesomeIcon
        icon={faSnowflake}
        size="3x"
        spin={true}
        color="#93c5fd"
      />
      Loading...
    </div>
  );
};
