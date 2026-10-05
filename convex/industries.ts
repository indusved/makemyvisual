export const BRAND = "MakeMyVisual";

export type FieldCopy = { label: string; placeholder: string; hint?: string };
export type PhotoTip = { id: string; title: string; detail: string };

// One entry per industry. Adding an industry = adding an entry here (plus its
// backgrounds in backgrounds.ts); the rest of the app reads everything from this.
export const INDUSTRIES = {
  automotive: {
    label: "Car dealership",
    chooserLabel: "I sell cars",
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
    // Share of the photo area the cut-out may fill.
    placement: { maxWidth: 0.9, maxHeight: 0.86 },
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
  d2c: {
    label: "D2C brand",
    chooserLabel: "I run a D2C brand",
    chooserDetail: "Gift hampers, fashion and more",
    brandSuffix: "for D2C Brands",
    path: "d2c",
    enabled: true,
    businessNoun: "brand",
    productNoun: "product",
    tagline: "Upload your product photo, type your offer, get ads in every social size in 2 minutes.",
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
    // Wider than a bottle: gift hampers are often broader than they are tall.
    placement: { maxWidth: 0.62, maxHeight: 0.72 },
    // Tuned for the first brands: gifting packages and fashion.
    photoTips: [
      { id: "whole", title: "Whole product in frame", detail: "Leave space on every side. Don't cut off the top, bottom or sides." },
      { id: "setup", title: "Gifts on a table, clothes hung up", detail: "Close the gift box and stand it on a table. Hang clothes on a hanger or a mannequin. Don't lay them flat." },
      { id: "height", title: "Phone level with the product", detail: "Hold your phone at the middle of the product, not above it." },
      { id: "plain", title: "Plain background, nothing else", detail: "A plain wall, door, or a bedsheet hung up behind it. No hands, people or other items." },
      { id: "light", title: "Soft window light", detail: "Near a window, flash off, no harsh shadows." },
    ],
    photoAvoid: [
      { id: "cropped", title: "Cut off", detail: "Top, bottom or sides outside the frame" },
      { id: "above", title: "Laid flat or from above", detail: "Clothes on a bed, or looking down at a box" },
      { id: "cluttered", title: "Cluttered", detail: "Hands, people or a busy room behind" },
      { id: "dark", title: "Too dark", detail: "Dim room, flash glare or deep shadow" },
    ],
  },
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;
export const DEFAULT_INDUSTRY: IndustryKey = "automotive";
export const INDUSTRY_KEYS = Object.keys(INDUSTRIES) as IndustryKey[];

export function productName(industry: IndustryKey = DEFAULT_INDUSTRY) {
  return `${BRAND} ${INDUSTRIES[industry].brandSuffix}`;
}

// "/cars" → automotive, "/d2c" → d2c, anything else → null (landing chooser).
export function industryFromPath(pathname: string): IndustryKey | null {
  const first = pathname.replace(/^\/+/, "").split("/")[0]?.toLowerCase() ?? "";
  return INDUSTRY_KEYS.find((k) => INDUSTRIES[k].enabled && INDUSTRIES[k].path === first) ?? null;
}
