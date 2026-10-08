import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePersistentNotifications } from "./notificationStore";
import * as apiModule from "./api";

// REH-135: Unit tests for notification read persistence across page refreshes

describe("usePersistentNotifications (REH-135)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockItems = [
    { id: "n1", is_read: false, title: "Notification 1" },
    { id: "n2", is_read: false, title: "Notification 2" },
    { id: "n3", is_read: true, title: "Notification 3" },
  ];

  it("initializes with default read statuses when no localStorage or server state exists", () => {
    vi.spyOn(apiModule, "api").mockResolvedValue({ read_ids: [] });

    const { result } = renderHook(() =>
      usePersistentNotifications("test-role", mockItems),
    );

    expect(result.current.notifications[0]?.is_read).toBe(false);
    expect(result.current.notifications[1]?.is_read).toBe(false);
    expect(result.current.notifications[2]?.is_read).toBe(true);
  });

  it("persists read status to localStorage when markAsRead is called", () => {
    vi.spyOn(apiModule, "api").mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      usePersistentNotifications("test-role", mockItems),
    );

    act(() => {
      result.current.markAsRead("n1");
    });

    expect(result.current.notifications[0]?.is_read).toBe(true);

    const stored = JSON.parse(
      localStorage.getItem("ethosk_read_notifs_test-role") || "[]",
    );
    expect(stored).toContain("n1");
  });

  it("restores read status after simulating a page refresh", () => {
    // 1. User marks n1 as read
    vi.spyOn(apiModule, "api").mockResolvedValue({ success: true });

    const firstMount = renderHook(() =>
      usePersistentNotifications("researcher", mockItems),
    );

    act(() => {
      firstMount.result.current.markAsRead("n1");
    });

    firstMount.unmount();

    // 2. Simulate page refresh: new component mount reads from localStorage
    const secondMount = renderHook(() =>
      usePersistentNotifications("researcher", mockItems),
    );

    expect(secondMount.result.current.notifications[0]?.is_read).toBe(true);
    expect(secondMount.result.current.notifications[1]?.is_read).toBe(false);
  });

  it("persists all read statuses when markAllAsRead is called and retains after refresh", () => {
    vi.spyOn(apiModule, "api").mockResolvedValue({ success: true });

    const firstMount = renderHook(() =>
      usePersistentNotifications("respondent", mockItems),
    );

    act(() => {
      firstMount.result.current.markAllAsRead();
    });

    expect(firstMount.result.current.notifications.every((n) => n.is_read)).toBe(
      true,
    );
    firstMount.unmount();

    // Remount simulates reload
    const secondMount = renderHook(() =>
      usePersistentNotifications("respondent", mockItems),
    );

    expect(secondMount.result.current.notifications.every((n) => n.is_read)).toBe(
      true,
    );
  });

  it("merges server-persisted read IDs on mount", async () => {
    vi.spyOn(apiModule, "api").mockImplementation(async (url: string) => {
      if (url === "/notifications") {
        return { read_ids: ["n2"] };
      }
      return { success: true };
    });

    const { result } = renderHook(() =>
      usePersistentNotifications("admin", mockItems),
    );

    await vi.waitFor(() => {
      expect(result.current.notifications.find((n) => n.id === "n2")?.is_read).toBe(
        true,
      );
    });
  });
});
