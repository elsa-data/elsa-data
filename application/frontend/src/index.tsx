import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { BrowserRouter } from "react-router-dom";
import {
  DeployedEnvironments,
  EnvRelayProvider,
} from "./providers/env-relay-provider";
import { QueryClient, QueryClientProvider } from "react-query";
import "./index.css";
import { CookiesProvider } from "react-cookie";
import { LoggedInUserProvider } from "./providers/logged-in-user-provider";
import { ErrorBoundary } from "./components/errors";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement as HTMLElement);

if (rootElement != null) {
  // there is a variety of backend environment and deploy time information that we would like to be known by the
  // React code
  // the pattern we use is that when the index page is served up by the server - it uses templating to set
  // a variety of data attributes on the rootElement DOM node
  //      data-semantic-version="1.2.3"
  // in the index.html that goes to the client
  // in the react this then comes into the rootElement element as a dataset (via HTML5 standard behaviour)
  // e.g.
  // rootElement.dataset.semanticVersion
  // (NOTE: the conversion from kebab casing to camel casing is AUTOMATIC as part of HTML5!)
  const loc = rootElement.dataset.locale || "en";
  const sv = rootElement.dataset.semanticVersion || "undefined version";
  const bv = rootElement.dataset.buildVersion || "-1";
  const de = (rootElement.dataset.deployedEnvironment ||
    "development") as DeployedEnvironments;
  const dl = rootElement.dataset.deployedLocation || "undefined location";
  const tfu =
    rootElement.dataset.terminologyFhirUrl || "undefined terminology FHIR URL";

  const queryClient = new QueryClient({});

  root.render(
    <React.StrictMode>
      {/* nested providers - outermost levels of nesting are those that are _least_ likely change dynamically */}
      <ErrorBoundary rethrowError={(_: any) => false}>
        {/* the env relay converts the backend index.html info into strongly typed values accessible throughout */}
        <EnvRelayProvider
          semanticVersion={sv}
          buildVersion={bv}
          deployedEnvironment={de}
          deployedLocation={dl}
          terminologyFhirUrl={tfu}
        >
          {/* the query provider comes from react-query and provides standardised remote query semantics */}
          <QueryClientProvider client={queryClient}>
            {/* we use session cookies for auth and use this provider to make them easily available */}
            <CookiesProvider>
              <LoggedInUserProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </LoggedInUserProvider>
            </CookiesProvider>
          </QueryClientProvider>
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
