import { ReleaseTypeLocal } from "./shared-types";
import { useOutletContext } from "react-router-dom";

/**
 * The master context is passed from the release master
 * page down into any sub-pages.
 */
export type ReleasesMasterContextType = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export function useReleasesMasterData() {
  return useOutletContext<ReleasesMasterContextType>();
}
