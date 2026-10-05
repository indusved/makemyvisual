import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { industryValidator } from "./schema";

// A small library of AI-made backdrops, generated once and reused by every user.
// The car or product is never generated: the user's real one is cut out and placed on top.
const SHARED =
  "Photorealistic, eye-level camera, wide angle, empty open floor in the centre foreground where a car will be placed, " +
  "absolutely no cars, no vehicles, no people, no text, no logos, no signage.";

const SHARED_PRODUCT =
  "Photorealistic product-photography backdrop, camera at table height looking straight on, shallow depth of field, " +
  "an empty clear surface in the centre foreground where a product will be placed, " +
  "absolutely no products, no bottles, no jars, no boxes, no packaging, no people, no hands, no text, no logos.";

export const PRESETS = [
  { key: "showroom", industry: "automotive", label: "Showroom", prompt: `A modern, bright car showroom interior with polished light-grey floor, glass walls and soft overhead lighting. ${SHARED}` },
  { key: "city-night", industry: "automotive", label: "City at night", prompt: `A wet city street at night with blurred neon and street-light bokeh in the background, reflections on the asphalt. ${SHARED}` },
  { key: "highway-sunset", industry: "automotive", label: "Highway sunset", prompt: `An open highway at golden-hour sunset with warm sky and distant hills, smooth asphalt in the foreground. ${SHARED}` },
  { key: "festive", industry: "automotive", label: "Festive lights", prompt: `A festive evening scene with warm string lights, soft golden bokeh and subtle marigold garlands at the edges, smooth paved floor. ${SHARED}` },
  { key: "studio", industry: "automotive", label: "Clean studio", prompt: `A seamless clean white-to-light-grey photo studio cyclorama with soft even lighting and a gentle floor gradient. ${SHARED}` },
  { key: "mountain-road", industry: "automotive", label: "Mountain road", prompt: `A scenic mountain road viewpoint on a clear day with green slopes and blue sky, clean asphalt pull-out in the foreground. ${SHARED}` },
  // Made outside OpenAI (Higgsfield Soul Location, 3 Oct) and brought in with importFromUrl.
  { key: "dealership-floor", industry: "automotive", label: "Dealership floor", source: "import", prompt: `A modern, bright car showroom interior with polished light-grey floor, glass walls and soft overhead lighting. ${SHARED}` },
  // D2C presets tuned for the builder's first brands: gifting packages and fashion.
  { key: "d2c-studio", industry: "d2c", label: "Clean studio", prompt: `A seamless soft off-white studio sweep with gentle gradient and soft even lighting. ${SHARED_PRODUCT}` },
  { key: "d2c-festive", industry: "d2c", label: "Festive glow", prompt: `A rich festive table surface with warm golden bokeh lights and a few softly blurred marigold flowers at the far edges, Diwali evening mood. ${SHARED_PRODUCT}` },
  { key: "d2c-gift-table", industry: "d2c", label: "Red & gold gifting", prompt: `A deep red velvet tabletop with thin gold ribbon accents only at the far edges and warm golden fairy-light bokeh in the background, festive gifting mood. ${SHARED_PRODUCT} No gift boxes, no wrapped presents, no hampers.` },
  { key: "d2c-marble", industry: "d2c", label: "Marble counter", prompt: `A white marble countertop with soft grey veining against a softly blurred light neutral wall, bright natural morning light. ${SHARED_PRODUCT}` },
  { key: "d2c-wood", industry: "d2c", label: "Wooden table", prompt: `A warm light-oak wooden table top with a softly blurred green leafy plant and a bright window in the background. ${SHARED_PRODUCT}` },
  { key: "d2c-linen", industry: "d2c", label: "Soft linen", prompt: `A flat surface covered in soft natural beige linen fabric with gentle folds at the far edges, against a warm softly blurred pastel wall, flat and level surface in the centre foreground. ${SHARED_PRODUCT} No podiums, no pedestals, no raised platforms.` },
  { key: "d2c-boutique", industry: "d2c", label: "Boutique wall", prompt: "A minimal fashion boutique backdrop: warm beige limewash textured wall with a soft arched niche, light oak floor, soft daylight from the side, camera at chest height looking straight on, empty floor space in the centre foreground where a garment on a stand will be placed. Photorealistic. Absolutely no clothes, no mannequins, no hangers, no clothing rails, no products, no people, no text, no logos." },
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
    // Rows no longer in PRESETS are retired: hide them.
    const live = rows.filter((r) => order.includes(r.key));
    live.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    return await Promise.all(live.map(async (r) => ({ key: r.key, label: r.label, url: await ctx.storage.getUrl(r.storageId) })));
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

// Run once per deployment: npx convex run backgrounds:generateAll '{"industry":"d2c"}'
export const generateAll = internalAction({
  args: { industry: v.optional(industryValidator) },
  returns: v.null(),
  handler: async (ctx, { industry }) => {
    for (const preset of PRESETS) {
      if ("source" in preset && preset.source === "import") continue;
      if (industry && preset.industry !== industry) continue;
      await ctx.scheduler.runAfter(0, internal.backgrounds.generate, { key: preset.key });
    }
    return null;
  },
});

// Brings in a backdrop made elsewhere (e.g. Higgsfield, Runway) for a preset key.
// npx convex run backgrounds:importFromUrl '{"key":"...","url":"https://..."}'
export const importFromUrl = internalAction({
  args: { key: v.string(), url: v.string() },
  returns: v.null(),
  handler: async (ctx, { key, url }) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) throw new Error(`Unknown background preset: ${key}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error(`Not an image: ${type}`);
    const storageId = await ctx.storage.store(new Blob([await res.arrayBuffer()], { type }));
    await ctx.runMutation(internal.backgrounds.save, { key: preset.key, industry: preset.industry, label: preset.label, prompt: preset.prompt, storageId });
    console.log(`Imported background ${key}`);
    return null;
  },
});

// Removes a retired backdrop: npx convex run backgrounds:remove '{"key":"..."}'
export const remove = internalMutation({
  args: { key: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("backgrounds")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!row) return false;
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete(row._id);
    return true;
  },
});
