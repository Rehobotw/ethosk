import { Router } from "express";
import { researcherProfileSchema } from "@shared/validation/schemas.js";
import { auth, requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { admin, userClient } from "../lib/supabase.js";

export const researchersRouter = Router();

/**
 * The researcher's own profile. `rating` and `verified` are read-only here: both
 * are assigned by Ethosk from a researcher's track record, and a profile that
 * could mark itself verified would make the badge worthless to respondents.
 */
researchersRouter.get(
  "/profile",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("researcher_profiles")
      .select("user_id, bio, institution, rating, verified")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new ApiError(500, "PROFILE_READ_FAILED", error.message);

    res.json(
      data ?? {
        user_id: context.userId,
        bio: null,
        institution: null,
        rating: null,
        verified: false,
      },
    );
  }),
);

researchersRouter.post(
  "/profile",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(researcherProfileSchema, req.body);

    // Upsert through the service role: the row is keyed by the authenticated
    // user's own id, and signup may have failed to create it before this build
    // added the insert policy.
    const { data, error } = await admin
      .from("researcher_profiles")
      .upsert(
        {
          user_id: context.userId,
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.institution !== undefined && { institution: input.institution }),
        },
        { onConflict: "user_id" },
      )
      .select("user_id, bio, institution, rating, verified")
      .single();

    if (error) throw new ApiError(500, "PROFILE_SAVE_FAILED", error.message);
    res.json(data);
  }),
);
