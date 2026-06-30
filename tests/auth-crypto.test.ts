import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  safeEqual,
  signSession,
  verifySession,
} from "@/lib/auth-crypto";

const SECRET = "test-secret";

describe("password hashing", () => {
  it("verifies the correct password", () => {
    const stored = hashPassword("klientflo");
    expect(verifyPassword("klientflo", stored)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const stored = hashPassword("klientflo");
    expect(verifyPassword("nope", stored)).toBe(false);
  });

  it("produces a unique salt per hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("rejects a malformed stored hash", () => {
    expect(verifyPassword("x", "garbage")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("safeEqual", () => {
  it("matches equal strings and rejects different ones", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = signSession("user123", Date.now() + 10_000, SECRET);
    expect(verifySession(token, SECRET)).toBe("user123");
  });

  it("rejects an expired token", () => {
    const token = signSession("user123", Date.now() - 1, SECRET);
    expect(verifySession(token, SECRET)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = signSession("user123", Date.now() + 10_000, SECRET);
    const last = token.slice(-1);
    const tampered = token.slice(0, -1) + (last === "a" ? "b" : "a");
    expect(verifySession(tampered, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = signSession("user123", Date.now() + 10_000, SECRET);
    expect(verifySession(token, "other-secret")).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifySession("not-a-token", SECRET)).toBeNull();
  });
});
