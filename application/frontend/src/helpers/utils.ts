/**
 * Convert string into a Capitalize Space Title formatting.
 */
export function convertCamelCaseToTitle(camelCase: string) {
  const result = camelCase.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * A simple regex check if email is valid
 * @param email
 * @returns
 */
export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}
