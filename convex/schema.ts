import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const industryValidator = v.union(v.literal("automotive"), v.literal("d2c"));

export default defineSchema({
  ...authTables,
  businessProfiles: defineTable({
    userId: v.id("users"),
    industry: industryValidator,
    market: v.union(v.literal("IN"), v.literal("US")),
    businessName: v.string(),
    phone: v.optional(v.string()),
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
  }).index("by_user", ["userId"]),
});
