import React from "react";
import { LayoutBase } from "../layouts/layout-base";
import { useEnvRelay } from "../providers/env-relay-provider";

export const LoginDevPage: React.FC = () => {
  const envRelay = useEnvRelay();

  return (
    <div className="flex flex-col space-y-2">
      <p className="prose">
        The frontend was given the following settings via the backend
        environment.
        <pre>{JSON.stringify(envRelay, null, 2)}</pre>
      </p>
      <form action="/auth/login-bypass-1" method="POST" id="loginBypass1Form">
        <button className="btn-warning" type="submit">
          Log in (test user 1 - data owner)
        </button>
      </form>
      <form action="/auth/login-bypass-2" method="POST" id="loginBypass2Form">
        <button className="btn-warning" type="submit">
          Log in (test user 2 - researcher)
        </button>
      </form>
      <form action="/auth/login-bypass-3" method="POST" id="loginBypass3Form">
        <button className="btn-danger" type="submit">
          Log in (test user 3 - super admin)
        </button>
      </form>
    </div>
  );
};
