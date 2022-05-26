import React from "react";
import ReactDOM from "react-dom";
import { App } from "./app";
import { BrowserRouter, useNavigate } from "react-router-dom";
import {
  DeployedEnvironments,
  EnvRelayProvider,
} from "./providers/env-relay-provider";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider, AuthProviderProps } from "react-oidc-context";
import "./index.css";

const root = document.getElementById("root");

if (root != null) {
  // there is a variety of backend environment and deploy time information that we would like to be known by the
  // React code
  // the pattern we use is that when the index page is served up by the server - it uses templating to set
  // a variety of data attributes on the root DOM node
  //      data-semantic-version="1.2.3"
  // in the index.html that goes to the client
  // in the react this then comes into the root element as a dataset (via HTML5 standard behaviour)
  // e.g.
  // root.dataset.semanticVersion
  // (NOTE: the conversion from kebab casing to camel casing is AUTOMATIC as part of HTML5!)
  const sv = root.dataset.semanticVersion || "undefined version";
  const bv = root.dataset.buildVersion || "-1";
  const de = (root.dataset.deployedEnvironment ||
    "development") as DeployedEnvironments;

  const oidcConfig: AuthProviderProps = {
    authority: root.dataset.oidcIssuer!,
    client_id: root.dataset.oidcClientId!,
    client_secret: root.dataset.oidcClientSecret!,
    redirect_uri: root.dataset.oidcRedirectUri!,
  };

  const queryClient = new QueryClient({});

  ReactDOM.render(
    <React.StrictMode>
      {/* the env relay converts the backend index.html info into strongly typed values accessible throughout */}
      <EnvRelayProvider
        semanticVersion={sv}
        buildVersion={bv}
        deployedEnvironment={de}
      >
        <AuthProvider
          {...oidcConfig}
          onSigninCallback={() => {
            window.location.assign("/");
          }}
        >
          {/* the query provider comes from react-query and provides standardised remote query semantics */}
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </AuthProvider>
      </EnvRelayProvider>
    </React.StrictMode>,
    document.getElementById("root")
  );
}
