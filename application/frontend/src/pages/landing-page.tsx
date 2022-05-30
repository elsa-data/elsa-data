import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useQuery } from "react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { LayoutAuthPage } from "../layouts/layout-auth-page";

export const HomePage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  const auth = useAuth();

  const loginClick = (e: any) => {
    window.location.assign("/login");
  };

  return (
    <LayoutAuthPage>
      <button onClick={() => void auth.removeUser()}>Log out</button>
    </LayoutAuthPage>
  );
};
