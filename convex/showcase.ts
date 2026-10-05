import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { industryValidator, kindValidator } from "./schema";

const itemValidator = v.object({
  key: v.string(),
  industry: v.optional(industryValidator),
  kind: kindValidator,
  caption: v.string(),
  url: v.union(v.string(), v.null()),
});

// Example outputs for the home page (all) or a vertical page (that vertical + season-wide ones).
export const list = query({
  args: { industry: v.optional(industryValidator) },
  returns: v.array(itemValidator),
  handler: async (ctx, { industry }) => {
    const rows = (await ctx.db.query("showcase").take(60))
      .filter((r) => !industry || r.industry === industry || r.industry === undefined)
      .sort((a, b) => a.order - b.order);
    return await Promise.all(
      rows.map(async (r) => ({ key: r.key, industry: r.industry, kind: r.kind, caption: r.caption, url: await ctx.storage.getUrl(r.storageId) })),
    );
  },
});

// Admin: npx convex run showcase:uploadUrl, upload the image, then showcase:save.
export const uploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const save = internalMutation({
  args: {
    key: v.string(),
    industry: v.optional(industryValidator),
    kind: kindValidator,
    caption: v.string(),
    order: v.number(),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("showcase")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.storage.delete(existing.storageId);
      await ctx.db.replace(existing._id, args);
    } else {
      await ctx.db.insert("showcase", args);
    }
    return null;
  },
});

export const remove = internalMutation({
  args: { key: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("showcase")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!row) return false;
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete(row._id);
    return true;
  },
});
