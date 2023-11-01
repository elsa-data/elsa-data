export function getFirstExternalIdentifierValue(
  exVal?: { system: string; value: string }[],
): string {
  if (exVal?.length) {
    return exVal[0].value;
  }
  return "-";
}
