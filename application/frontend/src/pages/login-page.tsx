import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useLoggedInUser } from "../providers/logged-in-user-provider";
import { Navigate } from "react-router-dom";
import { RELEASES_ROUTE_PART } from "../../../backend/src/shared/constants-routes";

type Props = {
  showDevTestLogin: boolean;
};

export const LoginPageOrRedirect: React.FC<Props> = ({ showDevTestLogin }) => {
  const envRelay = useEnvRelay();
  const userObject = useLoggedInUser();

  if (userObject) {
    return <Navigate to={`/${RELEASES_ROUTE_PART}`} replace />;
  }

  return (
    <div className="relative">
      <form action="/auth/login" method="POST" id="loginTriggerForm">
        <button className="btn-neutral btn btn-xl m-2" type="submit">
          Log in (CILogon)
        </button>
      </form>
      <form action="/auth/login2/petermac" method="POST" id="login2TriggerForm">
        <button className="btn-neutral btn btn-xl m-2" type="submit">
          Log in (AAF Peter Mac)
        </button>
      </form>
      <form action="/auth/login2/unimelb" method="POST" id="login2TriggerForm">
        <button className="btn-neutral btn btn-xl m-2" type="submit">
          Log in (AAF Unimelb)
        </button>
      </form>
      <form action="/auth/login2/all" method="POST" id="login2TriggerForm">
        <button className="btn-neutral btn btn-xl m-2" type="submit">
          Log in (AAF All)
        </button>
      </form>
      {showDevTestLogin && (
        <div className="w-120 absolute top-0 right-0">
          <div className="card card-compact bg-base-100 shadow-lg">
            <div className="card-body">
              <h4 className="card-title">Dev Login Bypass</h4>
              <form
                id="loginBypass1Form"
                action="/auth/login-bypass-1"
                method="POST"
              >
                <button className="btn-error btn" type="submit">
                  Log in (test user 1 - SuperAdmin)
                </button>
              </form>
              <form
                id="loginBypass2Form"
                action="/auth/login-bypass-2"
                method="POST"
              >
                <button className="btn-primary btn" type="submit">
                  Log in (test user 2 - Administrator)
                </button>
              </form>
              <form
                id="loginBypass3Form"
                action="/auth/login-bypass-3"
                method="POST"
              >
                <button className="btn-secondary btn" type="submit">
                  Log in (test user 3 - Manager)
                </button>
              </form>
              <form
                id="loginBypass4Form"
                action="/auth/login-bypass-4"
                method="POST"
              >
                <button className="btn-accent btn" type="submit">
                  Log in (test user 4 - Member)
                </button>
              </form>
            </div>
          </div>

          <div className="card-compact card mt-4 bg-base-100 shadow-lg">
            <div className="card-body">
              <h4 className="card-title">Frontend Settings (via Backend)</h4>
              <pre className="font-mono text-xs">
                {JSON.stringify(envRelay, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
