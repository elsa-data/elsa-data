import React from "react";
import { Box } from "../../components/boxes";
import { VerticalTabs } from "../../components/vertical-tabs";
import { AustralianGenomicsDacRedcapTriggerDiv } from "./australian-genomics-dac-redcap/australian-genomics-dac-redcap-trigger-div";
import { ManualDacTriggerDiv } from "./manual/manual-dac-trigger-div";
import { RemsDacTriggerDiv } from "./rems-dac/rems-dac-trigger-div";
import { useLoggedInUserConfigRelay } from "../../providers/logged-in-user-config-relay-provider";

/**
 * A dashboard showing the available upstream DAC stacks from which we can source
 * applications to create new releases.
 *
 * @constructor
 */
export const DacDashboardPage: React.FC = () => {
  const userConfig = useLoggedInUserConfigRelay();

  // this should never happen
  if (!userConfig) return <></>;

  return (
    <>
      <Box heading="DAC">
        <VerticalTabs tabHeadings={userConfig.dacs.map((a) => a.description)}>
          {userConfig.dacs.map((a, idx) => {
            switch (a.type) {
              case "rems":
                return (
                  <RemsDacTriggerDiv
                    key={idx}
                    dacId={a.id}
                    dacRemsUrl={a.url}
                  />
                );

              case "manual":
                return <ManualDacTriggerDiv key={idx} dacId={a.id} />;

              case "redcap-australian-genomics-csv":
                return (
                  <AustralianGenomicsDacRedcapTriggerDiv
                    key={idx}
                    dacId={a.id}
                  />
                );
              default:
                return <div key={idx}>Unknown DAC type {(a as any).type}</div>;
            }
          })}
        </VerticalTabs>
      </Box>
    </>
  );
};
