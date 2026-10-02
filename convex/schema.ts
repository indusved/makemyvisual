import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  businessProfiles: defineTable({
    userId: v.id("users"),
    industry: v.union(v.literal("automotive"), v.literal("d2c")),
    market: v.union(v.literal("IN"), v.literal("US")),
    businessName: v.string(),
    phone: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),
});
