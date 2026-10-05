import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { industryValidator } from "./schema";

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
    // The vertical the form was filled in for; must match the saved profile.
    industry: industryValidator,
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
    // Never file an offer under another vertical (e.g. category changed mid-upload).
    if (profile && profile.industry !== args.industry) {
      await ctx.storage.delete(args.photoStorageId);
      throw new ConvexError("Your business category changed while saving. Please save the offer again.");
    }

    return await ctx.db.insert("jobs", {
      userId,
      industry: args.industry,
      photoStorageId: args.photoStorageId,
      headline,
      details: cleanText(args.details, LIMITS.details, "Offer details"),
      validity: cleanText(args.validity, LIMITS.validity, "Valid until"),
      finePrint: cleanText(args.finePrint, LIMITS.finePrint, "Fine print"),
      status: "submitted",
    });
  },
});

// This vertical's 10 newest offers.
export const mine = query({
  args: { industry: industryValidator },
  returns: v.array(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      industry: industryValidator,
      headline: v.string(),
      details: v.optional(v.string()),
      validity: v.optional(v.string()),
      finePrint: v.optional(v.string()),
      status: v.string(),
      photoUrl: v.union(v.string(), v.null()),
      cutoutUrl: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, { industry }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user_industry", (q) => q.eq("userId", userId).eq("industry", industry))
      .order("desc")
      .take(10);
    return await Promise.all(
      jobs.map(async (job) => ({
        _id: job._id,
        _creationTime: job._creationTime,
        industry: job.industry,
        headline: job.headline,
        details: job.details,
        validity: job.validity,
        finePrint: job.finePrint,
        status: job.status,
        photoUrl: await ctx.storage.getUrl(job.photoStorageId),
        cutoutUrl: job.cutoutStorageId ? await ctx.storage.getUrl(job.cutoutStorageId) : null,
      })),
    );
  },
});

async function ownJob(ctx: { db: any }, userId: string, jobId: any) {
  const job = await ctx.db.get(jobId);
  if (job === null || job.userId !== userId) throw new ConvexError("Offer not found.");
  return job;
}

export const markDone = mutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");
    const job = await ownJob(ctx, userId, jobId);
    if (job.status !== "done") await ctx.db.patch(jobId, { status: "done" });
    return null;
  },
});

// Counts downloads per offer (one per file or zip) for the submission numbers.
export const logDownload = mutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");
    const job = await ownJob(ctx, userId, jobId);
    await ctx.db.patch(jobId, { downloads: (job.downloads ?? 0) + 1 });
    return null;
  },
});

// Saves the in-browser car cutout (transparent PNG) so it is only computed once per offer.
export const setCutout = mutation({
  args: { jobId: v.id("jobs"), cutoutStorageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, { jobId, cutoutStorageId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");
    const job = await ownJob(ctx, userId, jobId);
    const file = await ctx.db.system.get(cutoutStorageId);
    if (file === null || file.contentType !== "image/png" || file.size > MAX_PHOTO_BYTES * 2) {
      if (file !== null) await ctx.storage.delete(cutoutStorageId);
      throw new ConvexError("The cut-out image could not be saved.");
    }
    if (job.cutoutStorageId) await ctx.storage.delete(job.cutoutStorageId);
    await ctx.db.patch(jobId, { cutoutStorageId });
    return null;
  },
});
