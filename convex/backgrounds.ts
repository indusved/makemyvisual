import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { industryValidator, kindValidator } from "./schema";
import { INDUSTRIES, SEASON } from "./industries";

// A small library of AI-made backdrops, generated once and reused by every user.
// The car or product is never generated: the user's real one is cut out and placed on top.
// Which vertical uses which preset (and in what order) lives in industries.ts.
const SHARED =
  "Photorealistic, eye-level camera, wide angle, empty open floor in the centre foreground where a car will be placed, " +
  "absolutely no cars, no vehicles, no people, no text, no logos, no signage.";

const SHARED_PRODUCT =
  "Photorealistic product-photography backdrop, camera at table height looking straight on, shallow depth of field, " +
  "an empty clear surface in the centre foreground where a product will be placed, " +
  "absolutely no products, no bottles, no jars, no boxes, no packaging, no people, no hands, no text, no logos.";

const SHARED_GARMENT =
  "Photorealistic, camera at chest height looking straight at the wall, an empty plain wall area in the centre where a garment " +
  "on a hanger will hang, a little floor visible at the bottom. Absolutely no clothes, no hangers, no hooks, no mannequins, " +
  "no clothing rails, no furniture in the centre, no products, no people, no text, no logos.";

const SHARED_GREETING =
  "Photorealistic festive greeting-card backdrop, camera straight on, warm and elegant, decorations only at the edges, " +
  "a calm empty area in the upper centre for text and an empty clear surface in the lower centre where a gift or product may be placed. " +
  "Absolutely no text, no letters, no numbers, no logos, no people, no hands, no gift boxes, no products, no packaging.";

export const PRESETS = [
  // Cars
  { key: "showroom", label: "Showroom", prompt: `A modern, bright car showroom interior with polished light-grey floor, glass walls and soft overhead lighting. ${SHARED}` },
  { key: "city-night", label: "City at night", prompt: `A wet city street at night with blurred neon and street-light bokeh in the background, reflections on the asphalt. ${SHARED}` },
  { key: "highway-sunset", label: "Highway sunset", prompt: `An open highway at golden-hour sunset with warm sky and distant hills, smooth asphalt in the foreground. ${SHARED}` },
  { key: "festive", label: "Festive lights", prompt: `A festive evening scene with warm string lights, soft golden bokeh and subtle marigold garlands at the edges, smooth paved floor. ${SHARED}` },
  { key: "studio", label: "Clean studio", prompt: `A seamless clean white-to-light-grey photo studio cyclorama with soft even lighting and a gentle floor gradient. ${SHARED}` },
  { key: "mountain-road", label: "Mountain road", prompt: `A scenic mountain road viewpoint on a clear day with green slopes and blue sky, clean asphalt pull-out in the foreground. ${SHARED}` },
  // Made outside OpenAI (Higgsfield Soul Location, 3 Oct) and brought in with importFromUrl.
  { key: "dealership-floor", label: "Dealership floor", source: "import", prompt: `A modern, bright car showroom interior with polished light-grey floor, glass walls and soft overhead lighting. ${SHARED}` },

  // Products (gifting, skincare; studio also fashion). Keys keep their original "d2c-" names.
  { key: "d2c-studio", label: "Clean studio", prompt: `A seamless soft off-white studio sweep with gentle gradient and soft even lighting. ${SHARED_PRODUCT}` },
  { key: "d2c-festive", label: "Festive glow", prompt: `A rich festive table surface with warm golden bokeh lights and a few softly blurred marigold flowers at the far edges, Diwali evening mood. ${SHARED_PRODUCT}` },
  { key: "d2c-gift-table", label: "Red & gold gifting", prompt: `A deep red velvet tabletop with thin gold ribbon accents only at the far edges and warm golden fairy-light bokeh in the background, festive gifting mood. ${SHARED_PRODUCT} No gift boxes, no wrapped presents, no hampers.` },
  { key: "d2c-marble", label: "Marble counter", prompt: `A white marble countertop with soft grey veining against a softly blurred light neutral wall, bright natural morning light. ${SHARED_PRODUCT}` },
  { key: "d2c-wood", label: "Wooden table", prompt: `A warm light-oak wooden table top with a softly blurred green leafy plant and a bright window in the background. ${SHARED_PRODUCT}` },
  { key: "d2c-linen", label: "Soft linen", prompt: `A flat surface covered in soft natural beige linen fabric with gentle folds at the far edges, against a warm softly blurred pastel wall, flat and level surface in the centre foreground. ${SHARED_PRODUCT} No podiums, no pedestals, no raised platforms.` },
  { key: "skincare-bathroom", label: "Bathroom shelf", prompt: `A clean bright bathroom vanity counter in pale stone with a softly blurred white-tiled wall and a small leafy plant at the far left edge, spa-like mood. ${SHARED_PRODUCT} No taps, no faucets, no sinks, no vases, no containers.` },

  // Diwali greetings (all verticals; see SEASON in industries.ts).
  { key: "greet-diyas", label: "Diyas", prompt: `A deep maroon backdrop with softly glowing clay diyas and a few marigold flowers along a dark wooden ledge only at the far left and right, warm golden bokeh above. ${SHARED_GREETING}` },
  { key: "greet-marigold", label: "Marigold toran", prompt: `A warm cream wall with a marigold and mango-leaf toran garland hanging along the top edge, soft warm daylight, a light wooden table surface across the bottom. ${SHARED_GREETING}` },
  { key: "greet-maroon-gold", label: "Maroon & gold", prompt: `A rich deep maroon silk drape with a subtle gold paisley pattern and warm golden fairy-light bokeh, a gold-trimmed dark tabletop across the bottom. ${SHARED_GREETING}` },
  { key: "greet-night-lights", label: "Night lights", prompt: `A Diwali night: warm string lights and glowing paper lanterns softly out of focus in a deep blue night sky, a dark terrace ledge with a few small diyas only at the far edges across the bottom. ${SHARED_GREETING}` },

  // Fashion: walls for clothes hanging on a hanger.
  { key: "d2c-boutique", label: "Boutique wall", prompt: "A minimal fashion boutique backdrop: warm beige limewash textured wall with a soft arched niche, light oak floor, soft daylight from the side, camera at chest height looking straight on, empty floor space in the centre foreground where a garment on a stand will be placed. Photorealistic. Absolutely no clothes, no mannequins, no hangers, no clothing rails, no products, no people, no text, no logos." },
  { key: "fashion-concrete", label: "Concrete wall", prompt: `A smooth light-grey polished concrete wall with soft natural daylight falling from the left, minimal modern urban studio, pale concrete floor. ${SHARED_GARMENT}` },
  { key: "fashion-festive", label: "Festive wall", prompt: `A warm festive backdrop: a softly lit terracotta-orange wall with a few marigold garlands hanging only at the far left and right edges and warm golden fairy-light bokeh, Diwali mood. ${SHARED_GARMENT}` },
] as const;

// A vertical's offer backdrops, or the season's greeting backdrops (kind "greeting").
export const list = query({
  args: { industry: industryValidator, kind: v.optional(kindValidator) },
  returns: v.array(v.object({ key: v.string(), label: v.string(), url: v.union(v.string(), v.null()) })),
  handler: async (ctx, { industry, kind }) => {
    const keys: readonly string[] = kind === "greeting" ? SEASON.backgrounds : INDUSTRIES[industry].backgrounds;
    const out: { key: string; label: string; url: string | null }[] = [];
    for (const key of keys) {
      const row = await ctx.db
        .query("backgrounds")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (row) out.push({ key: row.key, label: row.label, url: await ctx.storage.getUrl(row.storageId) });
    }
    return out;
  },
});

export const save = internalMutation({
  args: { key: v.string(), label: v.string(), prompt: v.string(), storageId: v.id("_storage") },
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
    await ctx.runMutation(internal.backgrounds.save, { key: preset.key, label: preset.label, prompt: preset.prompt, storageId });
    console.log(`Generated background ${key}`);
    return null;
  },
});

// Generates a vertical's missing presets (onlyMissing, default) or all of them:
// npx convex run backgrounds:generateAll '{"industry":"fashion"}'
export const generateAll = internalAction({
  args: { industry: v.optional(industryValidator), onlyMissing: v.optional(v.boolean()) },
  returns: v.array(v.string()),
  handler: async (ctx, { industry, onlyMissing = true }) => {
    const wanted = new Set<string>(industry ? [...INDUSTRIES[industry].backgrounds, ...SEASON.backgrounds] : PRESETS.map((p) => p.key));
    const have = new Set((await ctx.runQuery(internal.backgrounds.existingKeys, {})) as string[]);
    const started: string[] = [];
    for (const preset of PRESETS) {
      if ("source" in preset && preset.source === "import") continue;
      if (!wanted.has(preset.key) || (onlyMissing && have.has(preset.key))) continue;
      await ctx.scheduler.runAfter(0, internal.backgrounds.generate, { key: preset.key });
      started.push(preset.key);
    }
    return started;
  },
});

export const existingKeys = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => (await ctx.db.query("backgrounds").take(100)).map((r) => r.key),
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
    await ctx.runMutation(internal.backgrounds.save, { key: preset.key, label: preset.label, prompt: preset.prompt, storageId });
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
