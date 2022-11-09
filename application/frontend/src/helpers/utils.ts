/**
 * Convert string into a Capitalize Space Title formatting.
 */
export function convertCamelCaseToTitle(camelCase: string) {
  const result = camelCase.replace(/([A-Z])/g, " $1");
  const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
  return finalResult;
}

/**
 * Convert bytes to Human Readable byte size
 */
const suffixes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export const getStringReadableBytes = (bytes: number | null) => {
  if (!bytes) {
    return "0 Bytes";
  }
  const i = Math.floor(Math.log(bytes) / Math.log(1000));
  return (
    (!bytes && "0 Bytes") ||
    (bytes / Math.pow(1000, i)).toFixed(2) + " " + suffixes[i]
  );
};
