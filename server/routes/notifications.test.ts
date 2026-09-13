import { describe, expect, it, beforeEach } from "vitest";
import {
  clearNotificationStore,
  getReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications.js";

describe("Notifications Store and Read Persistence Logic (REH-135)", () => {
  beforeEach(() => {
    clearNotificationStore();
  });

  it("returns empty array when user has no read notifications", () => {
    const readIds = getReadNotificationIds("user-1");
    expect(readIds).toEqual([]);
  });

  it("persists a single notification read status for a specific user", () => {
    markNotificationRead("user-1", "notif-abc");

    expect(getReadNotificationIds("user-1")).toEqual(["notif-abc"]);
    // Isolation check: user-2 should not see user-1's read notifications
    expect(getReadNotificationIds("user-2")).toEqual([]);
  });

  it("persists multiple notifications when markAllNotificationsRead is called", () => {
    markAllNotificationsRead("user-2", ["notif-1", "notif-2", "notif-3"]);

    const user2Read = getReadNotificationIds("user-2");
    expect(user2Read).toContain("notif-1");
    expect(user2Read).toContain("notif-2");
    expect(user2Read).toContain("notif-3");
    expect(user2Read.length).toBe(3);
  });

  it("idempotently handles repeated read status marks", () => {
    markNotificationRead("user-3", "notif-repeat");
    markNotificationRead("user-3", "notif-repeat");

    const readIds = getReadNotificationIds("user-3");
    expect(readIds).toEqual(["notif-repeat"]);
  });
});
