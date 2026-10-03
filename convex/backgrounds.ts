import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { industryValidator } from "./schema";

// A small library of AI-made backdrops, generated once and reused by every dealer.
// The car is never generated: the dealer's real car is cut out and placed on top.
const SHARED =
  "Photorealistic, eye-level camera, wide angle, empty open floor in the centre foreground where a car will be placed, " +
  "absolutely no cars, no vehicles, no people, no text, no logos, no signage.";

export const PRESETS = [
  { key: "showroom", industry: "automotive", label: "Showroom", prompt: `A modern, bright car showroom interior with polished light-grey floor, glass walls and soft overhead lighting. ${SHARED}` },
  { key: "city-night", industry: "automotive", label: "City at night", prompt: `A wet city street at night with blurred neon and street-light bokeh in the background, reflections on the asphalt. ${SHARED}` },
  { key: "highway-sunset", industry: "automotive", label: "Highway sunset", prompt: `An open highway at golden-hour sunset with warm sky and distant hills, smooth asphalt in the foreground. ${SHARED}` },
  { key: "festive", industry: "automotive", label: "Festive lights", prompt: `A festive evening scene with warm string lights, soft golden bokeh and subtle marigold garlands at the edges, smooth paved floor. ${SHARED}` },
  { key: "studio", industry: "automotive", label: "Clean studio", prompt: `A seamless clean white-to-light-grey photo studio cyclorama with soft even lighting and a gentle floor gradient. ${SHARED}` },
  { key: "mountain-road", industry: "automotive", label: "Mountain road", prompt: `A scenic mountain road viewpoint on a clear day with green slopes and blue sky, clean asphalt pull-out in the foreground. ${SHARED}` },
] as const;

export const list = query({
  args: { industry: industryValidator },
  returns: v.array(v.object({ key: v.string(), label: v.string(), url: v.union(v.string(), v.null()) })),
  handler: async (ctx, { industry }) => {
    const rows = await ctx.db
      .query("backgrounds")
      .withIndex("by_industry", (q) => q.eq("industry", industry))
      .take(20);
    const order: string[] = PRESETS.map((p) => p.key);
    rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    return await Promise.all(rows.map(async (r) => ({ key: r.key, label: r.label, url: await ctx.storage.getUrl(r.storageId) })));
  },
});

export const save = internalMutation({
  args: { key: v.string(), industry: industryValidator, label: v.string(), prompt: v.string(), storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("backgrounds")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.storage.delete(existing.storageId);
      await ctx.db.replace(existing._id, args);
    } else {
      await ctx.db.insert("backgrounds", args);
    }
    return null;
  },
});

export const generate = internalAction({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, { key }) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) throw new Error(`Unknown background preset: ${key}`);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set on this deployment.");

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt: preset.prompt, size: "1536x1024", quality: "medium", n: 1 }),
    });
    if (!res.ok) throw new Error(`OpenAI image request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image.");

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const storageId = await ctx.storage.store(new Blob([bytes], { type: "image/png" }));
    await ctx.runMutation(internal.backgrounds.save, { key: preset.key, industry: preset.industry, label: preset.label, prompt: preset.prompt, storageId });
    console.log(`Generated background ${key}`);
    return null;
  },
});

// Run once per deployment: npx convex run backgrounds:generateAll
export const generateAll = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const preset of PRESETS) {
      await ctx.scheduler.runAfter(0, internal.backgrounds.generate, { key: preset.key });
    }
    return null;
  },
});
