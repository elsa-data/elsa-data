import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";

type Props = {
  showDevTestLogin: boolean;
};

export const LoginPage: React.FC<Props> = ({ showDevTestLogin }) => {
  const envRelay = useEnvRelay();
  return (
    <div className="relative">
      <form action="/auth/login" method="POST" id="loginTriggerForm">
        <button className="btn-normal" type="submit">
          Log in via CILogon
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
                <button className="btn-info btn" type="submit">
                  Log in (test user 3 - Manager)
                </button>
              </form>
              <form
                id="loginBypass4Form"
                action="/auth/login-bypass-4"
                method="POST"
              >
                <button className="btn-neutral btn" type="submit">
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
