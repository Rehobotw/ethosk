import { generateKeyPairSync, createSign, createVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalize, normalizeKey } from "./telebirr.js";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

/** Signs a payload the way telebirr does, so verification is tested against a real signature. */
function sign(fields: Record<string, unknown>): string {
  const signer = createSign("RSA-SHA256");
  signer.update(canonicalize(fields), "utf8");
  return signer.sign(privateKey, "base64");
}

describe("canonicalize", () => {
  it("sorts by key so both ends build the same string from either field order", () => {
    const a = canonicalize({ outTradeNo: "X1", totalAmount: "50.00", appId: "app" });
    const b = canonicalize({ appId: "app", totalAmount: "50.00", outTradeNo: "X1" });

    expect(a).toBe("appId=app&outTradeNo=X1&totalAmount=50.00");
    expect(a).toBe(b);
  });

  it("excludes the signature fields, which cannot be part of what is signed", () => {
    const canonical = canonicalize({
      outTradeNo: "X1",
      sign: "abc",
      sign_type: "SHA256WithRSA",
      signType: "SHA256WithRSA",
    });

    expect(canonical).toBe("outTradeNo=X1");
  });

  it("drops empty values, so an absent field and a blank one sign identically", () => {
    expect(canonicalize({ a: "1", b: "", c: null, d: undefined })).toBe("a=1");
  });

  it("produces a signature that verifies against the same canonical form", () => {
    const fields = { outTradeNo: "ETHOSK-1", totalAmount: "500.00", tradeStatus: "success" };
    const signature = sign(fields);

    // Tampering with any signed field must invalidate it — this is the whole
    // protection against a forged callback inflating a deposit.
    const tampered = { ...fields, totalAmount: "50000.00" };

    const verify = (payload: Record<string, unknown>, sig: string) => {
      const verifier = createVerify("RSA-SHA256");
      verifier.update(canonicalize(payload), "utf8");
      return verifier.verify(publicKey, sig, "base64");
    };

    expect(verify(fields, signature)).toBe(true);
    expect(verify(tampered, signature)).toBe(false);
  });
});

describe("normalizeKey", () => {
  it("leaves an already-armoured PEM alone", () => {
    expect(normalizeKey(publicKey, "PUBLIC")).toBe(publicKey.trim());
  });

  it("repairs the escaped newlines an env file introduces", () => {
    const escaped = publicKey.trim().replace(/\n/g, "\\n");
    expect(normalizeKey(escaped, "PUBLIC")).toBe(publicKey.trim());
  });

  it("adds armour to bare base64 copied out of a merchant portal", () => {
    const bare = publicKey
      .replace(/-----[A-Z ]+-----/g, "")
      .replace(/\s+/g, "");

    const normalized = normalizeKey(bare, "PUBLIC");

    expect(normalized.startsWith("-----BEGIN PUBLIC KEY-----")).toBe(true);
    expect(normalized.endsWith("-----END PUBLIC KEY-----")).toBe(true);
    // Must be usable, not merely well-formed.
    expect(normalized.replace(/[-A-Z\s]/g, "")).toBe(bare.replace(/[-A-Z\s]/g, ""));
  });
});
