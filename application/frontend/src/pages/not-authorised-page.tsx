import React from "react";
import { useMatches } from "react-router-dom";
import {
  DATABASE_FAIL_ROUTE_PART,
  NO_EMAIL_OR_NAME_ROUTE_PART,
  NO_SUBJECT_ID_ROUTE_PART,
} from "@umccr/elsa-constants/constants-routes";

export const NotAuthorisedPage: React.FC = () => {
  const matches = useMatches();

  // some crappy logic that allows us to redirect to /not-authorised/blah
  // and then match on blah to display custom error details
  // this is only for OIDC flows where we are pretty much limited to doing redirects
  let extraPath = "";

  if (matches && matches.length > 0) {
    const last = matches.slice(-1)[0];
    if (last && last.params) {
      if (last.params["*"]) extraPath = last.params["*"];
    }
  }

  return (
    <article className="prose max-w-none">
      {/* a set of redirect destinations from OIDC to show different messages */}
      {extraPath === NO_SUBJECT_ID_ROUTE_PART && (
        <div className="alert alert-error">
          <span>
            No <span className="font-mono">sub</span> field in login claim set.
          </span>
        </div>
      )}
      {extraPath === NO_EMAIL_OR_NAME_ROUTE_PART && (
        <div className="alert alert-error">
          <span>
            No <span className="font-mono">email</span> or{" "}
            <span className="font-mono">name</span> field in login claim set.
          </span>
          <span>
            Email and name are vital parts of the functioning of the system so
            they must be provided by the upstream identity provider
          </span>
        </div>
      )}
      {extraPath === DATABASE_FAIL_ROUTE_PART && (
        <div className="alert alert-error">
          <span>
            Database insert of user record failed so login process was aborted.
          </span>
        </div>
      )}
      <p>
        You have logged in with an identity that is not authorised to use this
        particular Elsa Data instance.
      </p>
      <p>
        If you are a researcher who has been instructed to log in to this Elsa
        Data for a data release - please speak to your Manager.
      </p>
      <p>
        If you are an administrator of data sets that are stored in this Elsa
        Data instance then please speak to the instance administrator.
      </p>
      <p>
        To log in as a completely different user you may need to clear your
        CILogon state by visiting{" "}
        <a href="https://cilogon.org/logout">the CILogon logout page</a>.
      </p>
    </article>
  );
};
