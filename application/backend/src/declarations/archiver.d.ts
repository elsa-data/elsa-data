import "archiver";

// add typescript support for archiver-zip-encrypted
// https://github.com/artem-karpenko/archiver-zip-encrypted
declare module "archiver" {
  interface CoreOptions {
    encryptionMethod?: "aes256" | "zip20" | undefined;
    password?: string | undefined;
  }
}
