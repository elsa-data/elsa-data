import React from "react";
import { LayoutBase } from "../layouts/layout-base";

export const LoginPage: React.FC = () => {
  return (
    <LayoutBase>
      <div className="flex flex-col space-y-2">
        <form action="/auth/login" method="POST" id="loginTriggerForm">
          <button className="btn-normal" type="submit">
            Log in via CILogon
          </button>
        </form>
      </div>
    </LayoutBase>
  );
};
