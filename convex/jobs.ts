import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEFAULT_INDUSTRY } from "./industries";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const LIMITS = { headline: 60, details: 80, validity: 40, finePrint: 200 };

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");
    return await ctx.storage.generateUploadUrl();
  },
});

function cleanText(value: string | undefined, max: number, field: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max) throw new ConvexError(`${field} must be ${max} characters or fewer.`);
  return trimmed;
}

export const create = mutation({
  args: {
    photoStorageId: v.id("_storage"),
    headline: v.string(),
    details: v.optional(v.string()),
    validity: v.optional(v.string()),
    finePrint: v.optional(v.string()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");

    const file = await ctx.db.system.get(args.photoStorageId);
    if (file === null) throw new ConvexError("The photo upload didn't finish. Please try again.");
    if (!file.contentType || !ALLOWED_TYPES.includes(file.contentType) || file.size > MAX_PHOTO_BYTES) {
      await ctx.storage.delete(args.photoStorageId);
      throw new ConvexError("Please upload a JPG, PNG or WebP photo under 10 MB.");
    }

    const headline = cleanText(args.headline, LIMITS.headline, "Offer headline");
    if (!headline) throw new ConvexError("Please type your offer headline.");

    const profile = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return await ctx.db.insert("jobs", {
      userId,
      industry: profile?.industry ?? DEFAULT_INDUSTRY,
      photoStorageId: args.photoStorageId,
      headline,
      details: cleanText(args.details, LIMITS.details, "Offer details"),
      validity: cleanText(args.validity, LIMITS.validity, "Valid until"),
      finePrint: cleanText(args.finePrint, LIMITS.finePrint, "Fine print"),
      status: "submitted",
    });
  },
});

export const mine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      headline: v.string(),
      details: v.optional(v.string()),
      validity: v.optional(v.string()),
      status: v.string(),
      photoUrl: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
    return await Promise.all(
      jobs.map(async (job) => ({
        _id: job._id,
        _creationTime: job._creationTime,
        headline: job.headline,
        details: job.details,
        validity: job.validity,
        status: job.status,
        photoUrl: await ctx.storage.getUrl(job.photoStorageId),
      })),
    );
  },
});
