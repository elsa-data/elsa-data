import { ReleaseTypeLocal } from "./shared-types";
import { useOutletContext } from "react-router-dom";

/**
 * The master context is passed from the release master
 * page down into any sub-pages.
 */
export type ReleasesMasterContextType = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

export function useReleasesMasterData() {
  return useOutletContext<ReleasesMasterContextType>();
}
