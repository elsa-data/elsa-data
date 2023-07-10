import { randomFillSync } from "node:crypto";

/**
 * Return a password suitable for the Zip passwords when we send down
 * object signed TSVs in an encrypted zip.
 *
 * NOTE: this password is at best a *small* layer of security
 * that protects against things like accidentally leaving the zip
 * file in a tmp or Downloads folder (etc). We choose a not too long, and not too
 * complicated (easy to copy/paste or retype on another system) - as again,
 * this is primarily protected against very superficial attacks (someone
 * finding a file in /tmp and going "I wonder what this is").
 *
 * The object signed URLs *within* the file are limited to a maximum
 * lifespan measured in days - so it is not like this needs to be super
 * resistant to attack.
 */
export function generateZipPassword() {
  // note we have arbitrarily chosen crockford base 32 as the set here
  // - not because we have encoded them as base32 but because it is a nice set
  // that has no confusing characters (drops ILOU)
  // https://www.crockford.com/base32.html
  return generatePassword(12, "0123456789ABCDEFGHJKMNPQRSTVWXYZ"); // pragma: allowlist secret
}

/**
 * We occasionally need to generate passwords for various things. This uses
 * the decent crypto from nodejs and lets us set some parameters.
 *
 * @param length
 * @param wishlist
 */
export function generatePassword(
  length: number,
  wishlist = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$" // pragma: allowlist secret
) {
  return Array.from(randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join("");
}
