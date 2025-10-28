import { describe, expect, test } from "bun:test";
import { randomBytes } from "crypto";

describe("crypto service", () => {
  test("wrapSecret and unwrapSecret round trip", async () => {
    const key = randomBytes(32).toString("base64");
    process.env.SERVER_WRAP_KEY = key;

    const { wrapSecret, unwrapSecret } = await import("../src/services/crypto");

    const payload = wrapSecret("hello world");
    const unwrapped = unwrapSecret(payload);

    expect(unwrapped).toBe("hello world");
  });

  test("invalid key length throws", async () => {
    process.env.SERVER_WRAP_KEY = Buffer.from("short").toString("base64");
    const { wrapSecret } = await import("../src/services/crypto");

    expect(() => wrapSecret("data")).toThrow(
      "SERVER_WRAP_KEY must decode to 32 bytes for AES-256-GCM",
    );
  });
});
