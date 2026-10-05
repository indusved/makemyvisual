export const BRAND = "MakeMyVisual";

export type FieldCopy = { label: string; placeholder: string; hint?: string };
export type PhotoTip = { id: string; title: string; detail: string };

// One entry per vertical. A business belongs to exactly one vertical: it is
// chosen once (home page or first setup screen) and verticals are never mixed.
// Adding a vertical = adding an entry here (plus any new backgrounds in
// backgrounds.ts); the rest of the app reads everything from this.
//
// placement: share of the photo area the cut-out may fill. mode "floor" stands
// the item on the ground with a contact shadow; "hanging" hangs it on the wall
// with a soft shadow behind (clothes on a hanger).
// backgrounds: preset keys from backgrounds.ts, in picker order (first = default).
export const INDUSTRIES = {
  automotive: {
    label: "Cars",
    chooserLabel: "Cars",
    chooserDetail: "Dealerships and used-car sellers",
    brandSuffix: "for Cars",
    path: "cars",
    enabled: true,
    businessNoun: "dealership",
    productNoun: "car",
    tagline: "Upload your car photo, type your offer, get ads in every social size in 2 minutes.",
    businessNamePlaceholder: "Sharma Motors",
    contactPlaceholder: "98765 43210 or sharmamotors.in",
    fields: {
      headline: { label: "Offer headline", placeholder: "₹50,000 off the XUV700" },
      details: { label: "Price or EMI (optional)", placeholder: "EMI from ₹9,999/month" },
      validity: { label: "Valid until (optional)", placeholder: "This weekend only" },
      finePrint: {
        label: "Fine print (optional)",
        placeholder: "Terms apply. Offer valid on select variants.",
        hint: "US lease or finance offers usually need terms shown here.",
      },
    },
    placement: { maxWidth: 0.9, maxHeight: 0.86, mode: "floor" },
    backgrounds: ["showroom", "city-night", "highway-sunset", "festive", "studio", "mountain-road", "dealership-floor"],
    photoTips: [
      { id: "whole", title: "Get the whole car in", detail: "Step back until both bumpers and all wheels fit, with a little space around." },
      { id: "angle", title: "Stand at the front corner", detail: "A front three-quarter view shows the front and one side." },
      { id: "height", title: "Shoot from headlight height", detail: "Crouch a little so your phone is level with the headlights." },
      { id: "light", title: "Use even daylight", detail: "Shade or a cloudy day is best. Avoid harsh noon sun and night." },
      { id: "clear", title: "Keep the car on its own", detail: "No people, other cars or poles touching or overlapping it." },
    ],
    photoAvoid: [
      { id: "cropped", title: "Cut off", detail: "Bumper or wheels outside the frame" },
      { id: "above", title: "From above", detail: "Shot from standing height looking down" },
      { id: "cluttered", title: "Cluttered", detail: "People or other cars overlapping" },
      { id: "dark", title: "Too dark", detail: "Night, deep shade or strong glare" },
    ],
  },
  fashion: {
    label: "Fashion",
    chooserLabel: "Fashion",
    chooserDetail: "Clothing and ethnic wear",
    brandSuffix: "for Fashion",
    path: "fashion",
    enabled: true,
    businessNoun: "brand",
    productNoun: "item",
    tagline: "Upload a photo of your outfit, type your offer, get ads in every social size in 2 minutes.",
    businessNamePlaceholder: "Kavya Ethnic",
    contactPlaceholder: "kavyaethnic.in or @kavyaethnic",
    fields: {
      headline: { label: "Offer headline", placeholder: "Festive kurtas, flat 30% off" },
      details: { label: "Price (optional)", placeholder: "From ₹1,199 · MRP ₹1,799" },
      validity: { label: "Valid until (optional)", placeholder: "This week only" },
      finePrint: {
        label: "Fine print or coupon code (optional)",
        placeholder: "Use code FESTIVE30. Free shipping over ₹999.",
        hint: "Coupon codes and terms appear in small print at the bottom of the ad.",
      },
    },
    placement: { maxWidth: 0.6, maxHeight: 0.8, mode: "hanging" },
    backgrounds: ["d2c-boutique", "fashion-concrete", "d2c-studio", "fashion-festive"],
    photoTips: [
      { id: "hang", title: "Hang it up", detail: "Put it on a hanger and hang it on a door or a plain wall. Don't lay it flat." },
      { id: "whole", title: "Whole outfit in frame", detail: "From the hanger hook to the hem, with space on every side." },
      { id: "height", title: "Phone at chest height", detail: "Stand straight in front of it, phone level with the middle of the outfit." },
      { id: "plain", title: "Plain wall, nothing else", detail: "No people, other clothes or furniture in the shot. Smooth out creases." },
      { id: "light", title: "Soft window light", detail: "Near a window, flash off, so colours look true." },
    ],
    photoAvoid: [
      { id: "cropped", title: "Cut off", detail: "Sleeves or hem outside the frame" },
      { id: "above", title: "Laid flat on a bed", detail: "Shot from above on a bed or floor" },
      { id: "cluttered", title: "Cluttered", detail: "Other clothes, people or a busy room" },
      { id: "dark", title: "Too dark", detail: "Dim room, flash glare or deep shadow" },
    ],
  },
  gifting: {
    label: "Gifting",
    chooserLabel: "Gifting",
    chooserDetail: "Gift hampers, boxes and corporate gifts",
    brandSuffix: "for Gifting",
    path: "gifting",
    enabled: true,
    businessNoun: "business",
    productNoun: "gift",
    tagline: "Upload a photo of your gift box or hamper, type your offer, get ads in every social size in 2 minutes.",
    businessNamePlaceholder: "The Gift Studio",
    contactPlaceholder: "thegiftstudio.in or @thegiftstudio",
    fields: {
      headline: { label: "Offer headline", placeholder: "Diwali gift hampers from ₹999" },
      details: { label: "Price (optional)", placeholder: "Now ₹1,499 · MRP ₹1,999" },
      validity: { label: "Valid until (optional)", placeholder: "Order by 25 Oct for Diwali delivery" },
      finePrint: {
        label: "Fine print or coupon code (optional)",
        placeholder: "Free delivery in Mumbai. Use code GIFT10.",
        hint: "Coupon codes and terms appear in small print at the bottom of the ad.",
      },
    },
    // Hampers are often broader than they are tall.
    placement: { maxWidth: 0.62, maxHeight: 0.72, mode: "floor" },
    backgrounds: ["d2c-festive", "d2c-gift-table", "d2c-wood", "d2c-marble", "d2c-linen", "d2c-studio"],
    photoTips: [
      { id: "closed", title: "Close it and stand it on a table", detail: "Lid on, ribbon tied, standing on a table. Show the front." },
      { id: "whole", title: "Whole gift in frame", detail: "Leave space on every side. Don't cut off the bow or the base." },
      { id: "height", title: "Phone level with the gift", detail: "Hold your phone at the middle of the box, not above it." },
      { id: "plain", title: "Plain background, nothing else", detail: "A plain wall or a bedsheet hung up behind it. No hands or other items." },
      { id: "light", title: "Soft window light", detail: "Near a window, flash off, no harsh shadows." },
    ],
    photoAvoid: [
      { id: "cropped", title: "Cut off", detail: "Bow or base outside the frame" },
      { id: "above", title: "From above", detail: "Looking down at the box" },
      { id: "cluttered", title: "Cluttered", detail: "Hands, wrapping paper or a busy room" },
      { id: "dark", title: "Too dark", detail: "Dim room, flash glare or deep shadow" },
    ],
  },
  skincare: {
    label: "Skincare & beauty",
    chooserLabel: "Skincare & beauty",
    chooserDetail: "Serums, creams and cosmetics",
    brandSuffix: "for Skincare",
    path: "skincare",
    enabled: true,
    businessNoun: "brand",
    productNoun: "product",
    tagline: "Upload your product photo, type your offer, get ads in every social size in 2 minutes.",
    businessNamePlaceholder: "Glow & Co.",
    contactPlaceholder: "glowandco.in or @glowandco",
    fields: {
      headline: { label: "Offer headline", placeholder: "Flat 30% off our bestselling serum" },
      details: { label: "Price (optional)", placeholder: "Now ₹699 · MRP ₹999" },
      validity: { label: "Valid until (optional)", placeholder: "Ends Sunday midnight" },
      finePrint: {
        label: "Fine print or coupon code (optional)",
        placeholder: "Use code GLOW30. T&C apply.",
        hint: "Coupon codes and terms appear in small print at the bottom of the ad.",
      },
    },
    placement: { maxWidth: 0.5, maxHeight: 0.72, mode: "floor" },
    backgrounds: ["d2c-marble", "skincare-bathroom", "d2c-studio", "d2c-linen", "d2c-wood"],
    photoTips: [
      { id: "stand", title: "Stand it up on a table", detail: "Bottle or jar upright, label facing you, cap on." },
      { id: "whole", title: "Whole product in frame", detail: "Leave space on every side. Don't cut off the cap or base." },
      { id: "height", title: "Phone level with the product", detail: "Hold your phone at the middle of the bottle, not above it." },
      { id: "plain", title: "Plain background, nothing else", detail: "A plain wall or sheet behind it. No hands or other products." },
      { id: "light", title: "Soft window light", detail: "Near a window, flash off, to avoid glare on glass." },
    ],
    photoAvoid: [
      { id: "cropped", title: "Cut off", detail: "Cap or base outside the frame" },
      { id: "above", title: "From above", detail: "Looking down on the product" },
      { id: "cluttered", title: "Cluttered", detail: "Hands, other products or a busy shelf" },
      { id: "dark", title: "Too dark", detail: "Dim room or flash glare on the glass" },
    ],
  },
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;
export const DEFAULT_INDUSTRY: IndustryKey = "automotive";
export const INDUSTRY_KEYS = Object.keys(INDUSTRIES) as IndustryKey[];

export function productName(industry: IndustryKey = DEFAULT_INDUSTRY) {
  return `${BRAND} ${INDUSTRIES[industry].brandSuffix}`;
}

// "/cars" → automotive, "/fashion" → fashion, …; anything else (including the
// retired "/d2c") → null, which shows the vertical chooser.
export function industryFromPath(pathname: string): IndustryKey | null {
  const first = pathname.replace(/^\/+/, "").split("/")[0]?.toLowerCase() ?? "";
  return INDUSTRY_KEYS.find((k) => INDUSTRIES[k].enabled && INDUSTRIES[k].path === first) ?? null;
}
