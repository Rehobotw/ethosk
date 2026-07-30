import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns undefined for an empty successful response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 201 })) as typeof fetch,
    );

    await expect(api("/auth/signup")).resolves.toBeUndefined();
  });

  it("parses a successful JSON response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch,
    );

    await expect(api<{ ok: boolean }>("/status")).resolves.toEqual({ ok: true });
  });
});