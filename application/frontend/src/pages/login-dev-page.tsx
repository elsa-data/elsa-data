import React from "react";
import { LayoutBase } from "../layouts/layout-base";
import { useEnvRelay } from "../providers/env-relay-provider";

export const LoginDevPage: React.FC = () => {
  const envRelay = useEnvRelay();

  return (
    <div className="prose flex flex-col space-y-2">
      <p>
        The frontend was given the following settings via the backend
        environment.
      </p>
      <pre>{JSON.stringify(envRelay, null, 2)}</pre>
      <form action="/auth/login-bypass-1" method="POST" id="loginBypass1Form">
        <button className="btn-danger" type="submit">
          Log in (test user 1 - SuperAdmin)
        </button>
      </form>
      <form action="/auth/login-bypass-2" method="POST" id="loginBypass2Form">
        <button className="btn-warning" type="submit">
          Log in (test user 2 - Administrator)
        </button>
      </form>
      <form action="/auth/login-bypass-3" method="POST" id="loginBypass3Form">
        <button className="btn-warning" type="submit">
          Log in (test user 3 - Manager)
        </button>
      </form>
      <form action="/auth/login-bypass-4" method="POST" id="loginBypass4Form">
        <button className="btn-warning" type="submit">
          Log in (test user 4 - Member)
        </button>
      </form>
    </div>
  );
};
