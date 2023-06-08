import { hasFlag } from "country-flag-icons";
import getUnicodeFlagIcon from "country-flag-icons/unicode";

type FlagsProps = {
  regions: string[];
};

export const Flags: React.FC<FlagsProps> = ({ regions }) => {
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
