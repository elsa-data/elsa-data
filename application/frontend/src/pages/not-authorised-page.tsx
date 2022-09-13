import React from "react";
import { LayoutBase } from "../layouts/layout-base";

export const NotAuthorisedPage: React.FC = () => {
  return (
    <LayoutBase>
      <p className="prose">
        You have logged in via CILogon - but with an identity that is not
        authorised to use this particular Elsa Data instance.
      </p>
      <p className="prose">
        If you are a researcher who has been instructed to log in to this Elsa
        Data for a data release - please speak to your PI.
      </p>
      <p className="prose">
        If you are an administrator of data sets that are stored in this Elsa
        Data instance then please speak to the instance administrator.
      </p>
      <p className="prose">
        To log in as a completely different user you may need to clear your
        CILogon state by visiting{" "}
        <a href="https://cilogon.org/logout">the CILogon logout page</a>.
      </p>
    </LayoutBase>
  );
};
