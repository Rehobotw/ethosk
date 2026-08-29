import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FaydaVerifyForm } from "./FaydaVerifyForm";
import { LanguageProvider } from "@/lib/language";

const apiMock = vi.fn().mockResolvedValue({
  verification_tier: "1_id_verified",
  verified_at: "2026-08-29T10:00:00.000Z",
  live: true,
  method: "qr_crypto",
  decoded: {
    full_name: "Abebe Kebede Alemu",
    gender: "M",
    date_of_birth: "2002-11-26",
    fan: "6140 **** **** 1234",
    face_base64: null,
    signature_verified: true,
  },
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

vi.mock("fayda-decoder", () => ({
  decodeImage: vi.fn().mockImplementation(async (bytes: Uint8Array) => {
    if (bytes.length === 0) {
      return {
        ok: false,
        error: { code: "NO_QR_FOUND", message: "No QR detected" },
      };
    }
    return {
      ok: true,
      document: "fayda",
      payload_version: "4",
      fields: {
        full_name: "Abebe Kebede Alemu",
        gender: "M",
        fan: "6140123412341234",
        date_of_birth: "2002-11-26",
        face: { format: "webp", base64: "UklGRjIAAABXRUJQVlA4" },
      },
      signature: {
        present: true,
        verified: null,
        jws: "eyJhbGciOiJSUzI1NiJ9..sig",
      },
      raw: {
        payload: "MOCK_PAYLOAD",
        map: { V: "4" },
      },
      meta: { library: "fayda-decoder", version: "0.1.0" },
    };
  }),
}));

vi.mock("fayda-decoder/verify", () => ({
  verifySignature: vi.fn().mockResolvedValue({
    verified: true,
    algorithm: "RS256",
    payload_version: "4",
    key_source: "bundled_nidp_v4",
    reason: null,
  }),
}));

function renderForm(onVerified = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <FaydaVerifyForm onVerified={onVerified} />
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("FaydaVerifyForm (Offline fayda-decoder integration)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    if (!File.prototype.arrayBuffer) {
      File.prototype.arrayBuffer = function () {
        return Promise.resolve(new ArrayBuffer(8));
      };
    }
    vi.clearAllMocks();
  });

  it("renders QR scan mode by default with dropzone and mode tabs", () => {
    renderForm();

    expect(screen.getByText(/Scan Fayda Card QR/i)).toBeDefined();
    expect(screen.getByText(/Enter ID Number \(FIN\)/i)).toBeDefined();
    expect(screen.getByText(/Upload photo of the back of your Fayda ID card/i)).toBeDefined();
    expect(screen.getByText(/Decodes the embedded QR code completely offline/i)).toBeDefined();
  });

  it("switches to manual FIN input tab and allows auto-fill demo ID", () => {
    renderForm();

    const manualTab = screen.getByText(/Enter ID Number \(FIN\)/i);
    fireEvent.click(manualTab);

    expect(screen.getByLabelText(/Fayda ID number \(FIN\)/i)).toBeDefined();

    const autoFillBtn = screen.getByText(/Auto-Fill Demo ID/i);
    fireEvent.click(autoFillBtn);

    const input = screen.getByPlaceholderText("3000 0000 0001") as HTMLInputElement;
    expect(input.value).toBe("3000 0000 0001");
  });

  it("decodes uploaded Fayda card photo and displays verified details with NIDP signature badge", async () => {
    const onVerifiedMock = vi.fn();
    renderForm(onVerifiedMock);

    const file = new File(["sample qr bytes"], "fayda_back.jpg", { type: "image/jpeg" });
    const dropzone = screen.getByText(/Upload photo of the back of your Fayda ID card/i).closest("div");

    fireEvent.drop(dropzone!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText("Fayda ID Card Decoded")).toBeDefined();
      expect(screen.getByText("Abebe Kebede Alemu")).toBeDefined();
      expect(screen.getByText("NIDP Cryptographic Signature Verified")).toBeDefined();
      expect(screen.getByText("6140 **** **** 1234")).toBeDefined();
      expect(screen.getByText("2002-11-26")).toBeDefined();
      expect(screen.getByText("Male")).toBeDefined();
    });

    // Click confirm button to submit to backend
    const confirmBtn = screen.getByRole("button", { name: /Confirm & Complete Verification/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/verify-fayda", {
        body: expect.objectContaining({
          qr_payload: "MOCK_PAYLOAD",
          fayda_id: "6140123412341234",
          full_name: "Abebe Kebede Alemu",
          gender: "M",
          dob: "2002-11-26",
          signature_verified: true,
        }),
      });
      expect(onVerifiedMock).toHaveBeenCalled();
    });
  });
});
