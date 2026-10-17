import { mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { industryValidator } from "./schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// "Remind me before Diwali": a guest leaves an email for one reminder. No sign-in needed, and it never
// makes an auth user or a business profile, so it is never counted as a signup.
// The same email twice keeps the first row and answers { already: true }.
export const join = mutation({
  args: {
    email: v.string(),
    industry: v.optional(industryValidator),
    source: v.union(v.literal("home"), v.literal("category")),
  },
  returns: v.object({ already: v.boolean() }),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      throw new ConvexError("Please type a valid email address.");
    }
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing !== null) return { already: true };
    await ctx.db.insert("waitlist", { email, industry: args.industry, source: args.source });
    return { already: false };
  },
});
