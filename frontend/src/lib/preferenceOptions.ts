// Display labels shown in the Refine Search / voice-results filter UI,
// paired index-for-index with the backend's canonical snake_case values
// (see backend/app/services/filter_constants.py). Kept as parallel arrays
// rather than a label->value dictionary so exact-character mismatches (the
// labels use an en dash, "–", not a hyphen) can't silently break lookups.

export const AGE_GROUP_OPTIONS = ["Below 18", "18 – 25", "26 – 35", "36 – 45", "Above 45"];
export const AGE_GROUP_VALUES = ["below_18", "18_25", "26_35", "36_45", "above_45"];

export const PRICE_BAND_OPTIONS = [
  "Below ₹10K",
  "₹10K – ₹25K",
  "₹25K – ₹50K",
  "₹50K – ₹1L",
  "Above ₹1L",
];
export const PRICE_BAND_VALUES = ["below_10k", "10k_25k", "25k_50k", "50k_1l", "above_1l"];

export const USAGE_OPTIONS = ["Daily Wear", "Office Wear", "Party Wear", "Festive", "Bridal"];
export const USAGE_VALUES = ["daily_wear", "office_wear", "party_wear", "festive", "bridal"];

/** Converts a display label (e.g. "₹25K – ₹50K") to its backend value ("25k_50k"). */
export function labelToValue(
  options: string[],
  values: string[],
  label: string | null,
): string | undefined {
  if (!label) return undefined;
  const idx = options.indexOf(label);
  return idx >= 0 ? values[idx] : undefined;
}

/** Converts a backend value (e.g. "25k_50k") back to its display label, for
 * pre-selecting a pill from a filter the LLM extracted rather than the user
 * picking it manually. */
export function valueToLabel(
  options: string[],
  values: string[],
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const idx = values.indexOf(value);
  return idx >= 0 ? options[idx] : null;
}
