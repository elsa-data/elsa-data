import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import {
  DeployedEnvironments,
  EnvRelayProvider,
} from "./providers/env-relay-provider";
import "./index.css";
import { CookiesProvider } from "react-cookie";
import { LoggedInUserProvider } from "./providers/logged-in-user-provider";
import { ErrorBoundary } from "./components/errors";
import { createRouter } from "./index-router";
import { TRPCProvider } from "./providers/trpc-provider";
import { isString } from "lodash";
import { LoggedInUserConfigRelayProvider } from "./providers/logged-in-user-config-relay-provider";
import ShowAlert from "./providers/show-alert-provider";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement as HTMLElement);

if (rootElement != null) {
  // there is a variety of backend environment and deploy time information that we would like to be known by the
  // React code
  // the pattern we use is that when the index page is served up by the server - it uses templating to set
  // a variety of data attributes on the rootElement DOM node
  //      data-deployed-environment="production"
  // in the index.html that goes to the client
  // in the react this then comes into the rootElement element as a dataset (via HTML5 native behaviour)
  // e.g.
  // rootElement.dataset.deployedEnvironment
  // (NOTE: the conversion from kebab casing to camel casing is AUTOMATIC as part of HTML5!)
  const loc = rootElement.dataset.locale || "en";
  const ver = rootElement.dataset.version || "undefined version";
  const built = rootElement.dataset.built || "unknown";
  const rev = rootElement.dataset.revision || "undefined revision";
  const de = (rootElement.dataset.deployedEnvironment ||
    "development") as DeployedEnvironments;
  const tfu =
    rootElement.dataset.terminologyFhirUrl || "undefined terminology FHIR URL";
  const fea: Set<string> = new Set<string>();
  if (isString(rootElement.dataset.features))
    for (const f of rootElement.dataset.features.split(" ")) {
      if (f.trim().length > 0) fea.add(f.trim());
    }
  const documentTitle = rootElement.dataset.documentTitle;
  const brandName = rootElement.dataset.brandName;
  const brandLogoUriRelative = rootElement.dataset.brandLogoUriRelative;

  root.render(
    <React.StrictMode>
      {/* nested providers - outermost levels of nesting are those that are _least_ likely change dynamically */}
      <ErrorBoundary rethrowError={(_: any) => false}>
        {/* the env relay converts the backend index.html info into strongly typed values accessible throughout */}
        <EnvRelayProvider
          version={ver}
          built={built}
          revision={rev}
          deployedEnvironment={de}
          terminologyFhirUrl={tfu}
          features={fea}
          documentTitle={documentTitle}
          brandName={brandName}
          brandLogoUriRelative={brandLogoUriRelative}
        >
          {/* we use session cookies for auth and use this provider to make them easily available */}
          <CookiesProvider>
            <ShowAlert>
              <LoggedInUserProvider>
                <TRPCProvider>
                  {/* the config relay gives us values from the backend that were dependent on the logged-in user */}
                  <LoggedInUserConfigRelayProvider>
                    <RouterProvider
                      router={createRouter(de === "development")}
                    />
                  </LoggedInUserConfigRelayProvider>
                </TRPCProvider>
              </LoggedInUserProvider>
            </ShowAlert>
          </CookiesProvider>
        </EnvRelayProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

/*
Lingui was interfering with our pivot to Vitejs. This was the
code we did have - look into re-enabling when we need multi lingual support.

import { messages } from "./locales/en/messages";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

<I18nProvider i18n={i18n}>
</I18nProvider>
i18n.load(loc, messages);
i18n.activate(loc);

 */
