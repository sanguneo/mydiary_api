import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export interface WrappedSecret {
  wrapped: string;
  iv: string;
  authTag: string;
}

const WRAP_KEY_LENGTH = 32;
const IV_LENGTH = 12;

const getWrapKeyBuffer = (): Buffer => {
  const base64Key = process.env.SERVER_WRAP_KEY;

  if (!base64Key) {
    throw new Error("SERVER_WRAP_KEY environment variable is not defined");
  }

  const keyBuffer = Buffer.from(base64Key, "base64");

  if (keyBuffer.length !== WRAP_KEY_LENGTH) {
    throw new Error("SERVER_WRAP_KEY must decode to 32 bytes for AES-256-GCM");
  }

  return keyBuffer;
};

export const wrapSecret = (plaintext: string): WrappedSecret => {
  const key = getWrapKeyBuffer();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    wrapped: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

export const unwrapSecret = (payload: WrappedSecret): string => {
  const key = getWrapKeyBuffer();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const encrypted = Buffer.from(payload.wrapped, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

export const generateAccountMasterKey = (): string =>
  randomBytes(32).toString("base64");
