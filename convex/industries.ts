export const BRAND = "MakeMyVisual";

// One entry per industry. Adding an industry = adding an entry here,
// then its layouts and offer fields; the rest of the app reads from this.
export const INDUSTRIES = {
  automotive: {
    label: "Car dealership",
    brandSuffix: "for Cars",
    enabled: true,
    businessNoun: "dealership",
    productNoun: "car",
  },
  d2c: {
    label: "D2C brand",
    brandSuffix: "for D2C Brands",
    enabled: false, // provision only; hidden in v1 (see IDEA_SCOPE.md parking lot)
    businessNoun: "brand",
    productNoun: "product",
  },
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;
export const DEFAULT_INDUSTRY: IndustryKey = "automotive";

export function productName(industry: IndustryKey = DEFAULT_INDUSTRY) {
  return `${BRAND} ${INDUSTRIES[industry].brandSuffix}`;
}
