import { Router } from "express";
import { auth, requireAuth } from "../lib/auth.js";
import { asyncRoute } from "../lib/http.js";

export const notificationsRouter = Router();

// In-memory set for persisted read notification IDs keyed by userId:notifId
const readNotificationSet = new Set<string>();

/**
 * GET /api/notifications
 * Returns all persisted read notification IDs for the current authenticated user.
 */
notificationsRouter.get(
  "/",
  requireAuth("respondent", "researcher", "admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const prefix = `${context.userId}:`;
    const readIds: string[] = [];

    for (const key of readNotificationSet) {
      if (key.startsWith(prefix)) {
        readIds.push(key.slice(prefix.length));
      }
    }

    res.json({ read_ids: readIds });
  }),
);

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read for the authenticated user.
 */
notificationsRouter.patch(
  "/:id/read",
  requireAuth("respondent", "researcher", "admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const id = req.params.id;
    if (id) {
      readNotificationSet.add(`${context.userId}:${id}`);
    }
    res.json({ success: true, id, is_read: true });
  }),
);

/**
 * POST /api/notifications/read-all
 * Marks multiple or all notifications as read for the authenticated user.
 */
notificationsRouter.post(
  "/read-all",
  requireAuth("respondent", "researcher", "admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
    for (const id of ids) {
      if (typeof id === "string" && id) {
        readNotificationSet.add(`${context.userId}:${id}`);
      }
    }
    res.json({ success: true, count: ids.length });
  }),
);
