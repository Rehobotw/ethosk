import { Router } from "express";
import crypto from "node:crypto";
import { supportTicketSchema, type SupportTicketRecord } from "@shared/validation/schemas.js";
import { admin } from "../lib/supabase.js";
import { mockStore } from "../lib/mockStore.js";
import { rateLimit } from "../lib/rateLimit.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";

export const supportRouter = Router();

/**
 * Limit support ticket submissions to 5 per minute per IP / user to prevent spam
 */
const ticketRateLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 1000,
  key: "support-ticket-submission",
});

/**
 * POST /api/support/tickets
 * Persists support and contact inquiry tickets with rate limiting and validation.
 */
supportRouter.post(
  "/tickets",
  ticketRateLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(supportTicketSchema, req.body);
    const userId = req.auth?.userId || null;

    let email = input.email?.trim();
    let name = input.name?.trim();

    if (userId) {
      const user = mockStore.users.get(userId);
      if (!email && user?.email) {
        email = user.email;
      }
      if (!name && user?.full_name) {
        name = user.full_name;
      }
    }

    if (!email) {
      throw new ApiError(400, "MISSING_EMAIL", "A valid email address is required to submit a support ticket.");
    }

    // Generate random 5-digit ticket number with ETH- prefix (e.g. ETH-74829)
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const ticketNumber = `ETH-${randomSuffix}`;

    const newTicket = {
      id: crypto.randomUUID(),
      ticket_number: ticketNumber,
      user_id: userId,
      name: name || null,
      email,
      category: input.category,
      subject: input.subject,
      message: input.message,
      status: "open" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("support_tickets")
      .insert(newTicket)
      .select("id, ticket_number, user_id, name, email, category, subject, message, status, created_at")
      .single();

    if (error) {
      // If table insertion failed, ensure fallback to in-memory store
      mockStore.supportTickets.push(newTicket as SupportTicketRecord);
      res.status(201).json({
        success: true,
        ticket: newTicket,
      });
      return;
    }

    res.status(201).json({
      success: true,
      ticket: data || newTicket,
    });
  }),
);
