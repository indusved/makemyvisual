import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { industryValidator, marketValidator } from "./schema";

const profileValidator = v.object({
  _id: v.id("businessProfiles"),
  industry: industryValidator,
  market: marketValidator,
  businessName: v.string(),
  contact: v.optional(v.string()),
});

export const mine = query({
  args: {},
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const p = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (p === null) return null;
    return { _id: p._id, industry: p.industry, market: p.market, businessName: p.businessName, contact: p.contact };
  },
});

export const save = mutation({
  args: {
    industry: industryValidator,
    market: marketValidator,
    businessName: v.string(),
    contact: v.optional(v.string()),
  },
  returns: v.id("businessProfiles"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");
    const businessName = args.businessName.trim();
    if (!businessName) throw new ConvexError("Please type your business name.");
    if (businessName.length > 60) throw new ConvexError("Business name must be 60 characters or fewer.");
    const contact = args.contact?.trim() || undefined;
    if (contact && contact.length > 60) throw new ConvexError("Phone or website must be 60 characters or fewer.");

    const existing = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const fields = { industry: args.industry, market: args.market, businessName, contact };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("businessProfiles", { userId, ...fields });
  },
});

// Used right after a guest signs in from a vertical page. Creates the profile,
// or updates the name and contact in the same vertical. Never moves a
// business to another vertical, and returns the vertical that is saved.
export const ensure = mutation({
  args: {
    industry: industryValidator,
    market: marketValidator,
    businessName: v.string(),
    contact: v.optional(v.string()),
  },
  returns: v.object({ industry: industryValidator }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Please sign in first.");
    const businessName = args.businessName.trim();
    if (!businessName) throw new ConvexError("Please type your business name.");
    if (businessName.length > 60) throw new ConvexError("Business name must be 60 characters or fewer.");
    const contact = args.contact?.trim() || undefined;
    if (contact && contact.length > 60) throw new ConvexError("Phone or website must be 60 characters or fewer.");

    const existing = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing === null) {
      await ctx.db.insert("businessProfiles", { userId, industry: args.industry, market: args.market, businessName, contact });
      return { industry: args.industry };
    }
    if (existing.industry !== args.industry) return { industry: existing.industry };
    await ctx.db.patch(existing._id, contact ? { businessName, contact } : { businessName });
    return { industry: existing.industry };
  },
});
