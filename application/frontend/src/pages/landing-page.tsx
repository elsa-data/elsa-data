import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { useQuery } from "react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LayoutBase } from "../layouts/layout-base";

export const HomePage: React.FC = () => {
  const envRelay = useEnvRelay();
  const navigate = useNavigate();

  return <LayoutBase></LayoutBase>;
};
