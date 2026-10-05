import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Verticals (see industries.ts). A business belongs to exactly one.
export const industryValidator = v.union(
  v.literal("automotive"),
  v.literal("fashion"),
  v.literal("gifting"),
  v.literal("skincare"),
);
export const marketValidator = v.union(v.literal("IN"), v.literal("US"));

export default defineSchema({
  ...authTables,
  businessProfiles: defineTable({
    userId: v.id("users"),
    industry: industryValidator,
    market: marketValidator,
    businessName: v.string(),
    phone: v.optional(v.string()),
    // Phone, website or handle shown on the ads.
    contact: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),
  jobs: defineTable({
    userId: v.id("users"),
    industry: industryValidator,
    photoStorageId: v.id("_storage"),
    headline: v.string(),
    details: v.optional(v.string()),
    validity: v.optional(v.string()),
    finePrint: v.optional(v.string()),
    status: v.union(v.literal("submitted"), v.literal("generating"), v.literal("done"), v.literal("failed")),
    downloads: v.optional(v.number()),
    cutoutStorageId: v.optional(v.id("_storage")),
  })
    .index("by_user", ["userId"])
    .index("by_user_industry", ["userId", "industry"]),
  backgrounds: defineTable({
    key: v.string(),
    // Retired: which vertical uses a backdrop now lives in industries.ts.
    industry: v.optional(v.string()),
    label: v.string(),
    prompt: v.string(),
    storageId: v.id("_storage"),
  }).index("by_key", ["key"]).index("by_industry", ["industry"]),
});
