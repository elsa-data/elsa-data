import { ElsaSettings } from "../config/elsa-settings";

/**
 * Helper function to extract the document title from the brand name.
 * @param settings
 */
export function getDocumentTitle(settings: ElsaSettings): string {
  const brandName = settings.branding?.brandName;
  return brandName ? `Elsa Data – ${brandName}` : "Elsa Data";
}
