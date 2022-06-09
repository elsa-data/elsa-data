import React from "react";
import { LayoutBase } from "../layouts/layout-base";

export const LoginPage: React.FC = () => {
  return (
    <LayoutBase>
      <div className="flex flex-col space-y-2">
        <form action="/auth/login" method="POST" id="loginTriggerForm">
          <input type="hidden" id="var1" name="var1" value="a" />
          <input type="hidden" id="var2" name="var2" value="b" />
          <button className="btn btn-blue" type="submit">
            Log in (real)
          </button>
        </form>
        <form action="/auth/login-bypass-1" method="POST" id="loginBypass1Form">
          <button className="btn btn-blue" type="submit">
            Log in (test user 1)
          </button>
        </form>
      </div>
    </LayoutBase>
  );
};
