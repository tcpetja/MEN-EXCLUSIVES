import type { SuitConfig } from "@/components/suit/config";

export type LineId = "executive" | "black-tie" | "double-breasted" | "wedding";

export const LINES: { id: LineId; name: string; note: string }[] = [
  {
    id: "executive",
    name: "Executive Two-Piece",
    note: "The working suit. Worsted wool, a clean shoulder, cut to sit well all day.",
  },
  {
    id: "black-tie",
    name: "Black Tie Tuxedo",
    note: "Dinner jackets with satin facings, jetted pockets and a single button.",
  },
  {
    id: "double-breasted",
    name: "Double-Breasted",
    note: "6 buttons, peak lapels and a wrapped front that squares the chest.",
  },
  {
    id: "wedding",
    name: "Wedding Collection",
    note: "Lighter cloths and paler shades for the day itself, and the summers after.",
  },
];

export const CHESTS = [36, 38, 40, 42, 44, 46, 48] as const;
export const LENGTHS = [
  { id: "S", name: "Short", height: "Under 5′7″ (170 cm)" },
  { id: "R", name: "Regular", height: "5′7″ to 6′0″ (170–183 cm)" },
  { id: "L", name: "Long", height: "Over 6′0″ (183 cm)" },
] as const;

export type Chest = (typeof CHESTS)[number];
export type LengthId = (typeof LENGTHS)[number]["id"];

export interface Product {
  slug: string;
  name: string;
  line: LineId;
  /** Price in minor units. */
  price: number;
  shade: string;
  blurb: string;
  details: string[];
  suit: SuitConfig;
  /** Sizes currently out of stock, as "40R". */
  soldOut: string[];
}

const base: Pick<SuitConfig, "pattern" | "satinLapel" | "jetted" | "pocketSquare" | "buttonFinish"> = {
  pattern: "plain",
  satinLapel: false,
  jetted: false,
  pocketSquare: true,
  buttonFinish: "horn",
};

export const PRODUCTS: Product[] = [
  {
    slug: "executive-obsidian",
    name: "Executive Two-Piece in Obsidian",
    line: "executive",
    price: 185000,
    shade: "Obsidian",
    blurb: "Our house black: a deep worsted twill with a notch lapel and a 2-button front.",
    details: ["Super 130s Italian wool, 280 g", "Notch lapel, 2 buttons, flap pockets", "Half-canvassed, horn buttons", "Flat-front trousers, unfinished hem"],
    suit: { ...base, cloth: "wool", color: "#16171b", lapel: "notch", buttons: "two", neckwear: "tie", neckwearColor: "#3a3d44" },
    soldOut: ["36S", "48L"],
  },
  {
    slug: "executive-midnight",
    name: "Executive Two-Piece in Midnight Navy",
    line: "executive",
    price: 185000,
    shade: "Midnight Navy",
    blurb: "Navy dark enough for the evening, bright enough for daylight. The suit to own first.",
    details: ["Super 130s Italian wool, 280 g", "Notch lapel, 2 buttons, flap pockets", "Half-canvassed, horn buttons", "Flat-front trousers, unfinished hem"],
    suit: { ...base, cloth: "wool", color: "#18203a", lapel: "notch", buttons: "two", neckwear: "tie", neckwearColor: "#5a1a22" },
    soldOut: ["44S"],
  },
  {
    slug: "executive-chalk-stripe",
    name: "Executive Two-Piece in Chalk Stripe",
    line: "executive",
    price: 195000,
    shade: "Charcoal Chalk Stripe",
    blurb: "A soft chalked stripe on charcoal, with a peak lapel to match its confidence.",
    details: ["Super 130s Italian wool, 280 g", "Peak lapel, 2 buttons, flap pockets", "Half-canvassed, horn buttons", "Pleated trousers, unfinished hem"],
    suit: { ...base, cloth: "wool", color: "#2c2e33", pattern: "chalkstripe", lapel: "peak", buttons: "two", neckwear: "tie", neckwearColor: "#7d6330" },
    soldOut: ["36S", "36R", "46L"],
  },
  {
    slug: "tuxedo-shawl",
    name: "Black Tie Tuxedo, Shawl Lapel",
    line: "black-tie",
    price: 225000,
    shade: "Jet",
    blurb: "The classic dinner suit. A satin shawl lapel in one unbroken line.",
    details: ["Italian wool barathea, 300 g", "Satin shawl lapel, 1 covered button", "Jetted pockets, satin trim", "Trousers with a satin side stripe"],
    suit: { ...base, cloth: "wool", color: "#101114", lapel: "shawl", buttons: "one", satinLapel: true, jetted: true, neckwear: "bow", neckwearColor: "#0b0b0d" },
    soldOut: ["48S"],
  },
  {
    slug: "tuxedo-midnight-peak",
    name: "Black Tie Tuxedo, Midnight Peak",
    line: "black-tie",
    price: 225000,
    shade: "Midnight",
    blurb: "Midnight blue reads blacker than black under evening light. Peak lapels in satin.",
    details: ["Italian wool barathea, 300 g", "Satin peak lapel, 1 covered button", "Jetted pockets, satin trim", "Trousers with a satin side stripe"],
    suit: { ...base, cloth: "wool", color: "#131a30", lapel: "peak", buttons: "one", satinLapel: true, jetted: true, neckwear: "bow", neckwearColor: "#0b0b0d" },
    soldOut: ["36L", "38S"],
  },
  {
    slug: "dinner-jacket-bottle-velvet",
    name: "Velvet Dinner Jacket in Bottle Green",
    line: "black-tie",
    price: 245000,
    shade: "Bottle Green",
    blurb: "Cotton velvet with a deep pile, for when the invitation says black tie and you mean more.",
    details: ["Italian cotton velvet, 360 g", "Satin shawl lapel, 1 covered button", "Jetted pockets, satin trim", "Sold with black barathea trousers"],
    suit: { ...base, cloth: "velvet", color: "#0f2f22", lapel: "shawl", buttons: "one", satinLapel: true, jetted: true, neckwear: "bow", neckwearColor: "#0b0b0d" },
    soldOut: ["46S", "48S", "48R"],
  },
  {
    slug: "double-breasted-charcoal",
    name: "Double-Breasted in Charcoal",
    line: "double-breasted",
    price: 210000,
    shade: "Charcoal",
    blurb: "A 6-on-2 front in charcoal worsted. Wear it fastened; that is the point of it.",
    details: ["Super 130s Italian wool, 280 g", "Peak lapel, 6 buttons, 2 to fasten", "Half-canvassed, horn buttons", "Pleated trousers, unfinished hem"],
    suit: { ...base, cloth: "wool", color: "#34363b", lapel: "peak", buttons: "double", neckwear: "tie", neckwearColor: "#1c2540" },
    soldOut: ["36S"],
  },
  {
    slug: "double-breasted-ink-cashmere",
    name: "Double-Breasted in Ink Cashmere",
    line: "double-breasted",
    price: 340000,
    shade: "Ink Navy",
    blurb: "Pure brushed cashmere, cut double-breasted. Soft in the hand, firm in the line.",
    details: ["Pure cashmere, 340 g", "Peak lapel, 6 buttons, 2 to fasten", "Full canvas, horn buttons", "Pleated trousers, unfinished hem"],
    suit: { ...base, cloth: "cashmere", color: "#1b2236", lapel: "peak", buttons: "double", neckwear: "tie", neckwearColor: "#5a1a22" },
    soldOut: ["36S", "36R", "48L"],
  },
  {
    slug: "double-breasted-camel",
    name: "Double-Breasted in Camel Cashmere",
    line: "double-breasted",
    price: 340000,
    shade: "Camel",
    blurb: "Camel cashmere with dark horn buttons. Made for cold mornings and long lunches.",
    details: ["Pure cashmere, 340 g", "Peak lapel, 6 buttons, 2 to fasten", "Full canvas, horn buttons", "Pleated trousers, unfinished hem"],
    suit: { ...base, cloth: "cashmere", color: "#a17a4d", lapel: "peak", buttons: "double", neckwear: "tie", neckwearColor: "#3e2c22" },
    soldOut: ["44L", "46L"],
  },
  {
    slug: "wedding-ivory-linen",
    name: "Wedding Suit in Ivory Linen",
    line: "wedding",
    price: 165000,
    shade: "Ivory",
    blurb: "Irish linen in ivory for warm-weather ceremonies. It creases, and looks better for it.",
    details: ["Irish linen, 310 g", "Notch lapel, 2 buttons, flap pockets", "Half-lined for airflow", "Flat-front trousers, unfinished hem"],
    suit: { ...base, cloth: "linen", color: "#d6ccb8", lapel: "notch", buttons: "two", neckwear: "tie", neckwearColor: "#7f8f78" },
    soldOut: ["36S", "38S"],
  },
  {
    slug: "wedding-air-force-linen",
    name: "Wedding Suit in Air Force Blue Linen",
    line: "wedding",
    price: 165000,
    shade: "Air Force Blue",
    blurb: "A dusty blue that sits well beside every colour a wedding party will throw at it.",
    details: ["Irish linen, 310 g", "Notch lapel, 2 buttons, flap pockets", "Half-lined for airflow", "Flat-front trousers, unfinished hem"],
    suit: { ...base, cloth: "linen", color: "#566b80", lapel: "notch", buttons: "two", neckwear: "tie", neckwearColor: "#d9d2c2" },
    soldOut: ["48L"],
  },
  {
    slug: "wedding-dove-grey",
    name: "Wedding Suit in Dove Grey",
    line: "wedding",
    price: 195000,
    shade: "Dove Grey",
    blurb: "Pale worsted with a peak lapel and brushed gold buttons. A morning suit's modern cousin.",
    details: ["Super 130s Italian wool, 280 g", "Peak lapel, 2 buttons, flap pockets", "Half-canvassed, brushed gold buttons", "Flat-front trousers, unfinished hem"],
    suit: { ...base, cloth: "wool", color: "#7d8087", lapel: "peak", buttons: "two", buttonFinish: "gold", neckwear: "tie", neckwearColor: "#b9a472" },
    soldOut: ["36L", "46S"],
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getLine(id: LineId) {
  return LINES.find((l) => l.id === id)!;
}

export function productImage(slug: string, view: "full" | "detail" = "full") {
  return `/suits/${slug}${view === "detail" ? "-detail" : ""}.webp`;
}

export const PRODUCT_IMAGE_SIZE = { width: 960, height: 1200 };

/** Body measurements each chest size is cut to fit, in inches. */
export const SIZE_CHART: Record<Chest, { waist: number; shoulder: number; sleeve: number; length: number }> = {
  36: { waist: 30, shoulder: 17.25, sleeve: 24.5, length: 29 },
  38: { waist: 32, shoulder: 17.75, sleeve: 25, length: 29.5 },
  40: { waist: 34, shoulder: 18.25, sleeve: 25.25, length: 30 },
  42: { waist: 36, shoulder: 18.75, sleeve: 25.5, length: 30.5 },
  44: { waist: 38, shoulder: 19.25, sleeve: 25.75, length: 31 },
  46: { waist: 40, shoulder: 19.75, sleeve: 26, length: 31.5 },
  48: { waist: 42, shoulder: 20.25, sleeve: 26.25, length: 32 },
};
