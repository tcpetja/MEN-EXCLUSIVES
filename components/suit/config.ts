export type ClothId = "wool" | "cashmere" | "linen" | "velvet";
export type LapelId = "notch" | "peak" | "shawl";
export type ButtonsId = "one" | "two" | "three" | "double";
export type ButtonFinish = "horn" | "gold";
export type Neckwear = "tie" | "bow" | "open";
export type ClothPattern = "plain" | "chalkstripe";

/** Everything the 3D model needs to draw one suit. */
export interface SuitConfig {
  cloth: ClothId;
  /** Cloth colour, sRGB hex. */
  color: string;
  pattern: ClothPattern;
  lapel: LapelId;
  buttons: ButtonsId;
  buttonFinish: ButtonFinish;
  /** Satin lapel facings, as on a dinner jacket. */
  satinLapel: boolean;
  /** Jetted (flapless) hip pockets, as on a dinner jacket. */
  jetted: boolean;
  neckwear: Neckwear;
  neckwearColor: string;
  pocketSquare: boolean;
}

export interface Shade {
  id: string;
  name: string;
  color: string;
  pattern?: ClothPattern;
}

export interface Cloth {
  id: ClothId;
  name: string;
  /** One line on how it wears. */
  note: string;
  /** Woven into the selvedge strip on the swatch. */
  selvedge: string;
  weight: string;
  /** Starting price of a two-piece cut in this cloth, in minor units. */
  fromPrice: number;
  shades: Shade[];
}

export const CLOTHS: Cloth[] = [
  {
    id: "wool",
    name: "Italian Wool",
    note: "Worsted twill from Biella. Holds a crease, sheds a wrinkle, wears year-round.",
    selvedge: "Super 130s · Biella · Italy",
    weight: "280\u00a0g",
    fromPrice: 240000,
    shades: [
      { id: "obsidian", name: "Obsidian", color: "#16171b" },
      { id: "midnight", name: "Midnight Navy", color: "#18203a" },
      { id: "charcoal", name: "Charcoal", color: "#34363b" },
      { id: "chalkstripe", name: "Charcoal Chalk Stripe", color: "#2c2e33", pattern: "chalkstripe" },
    ],
  },
  {
    id: "cashmere",
    name: "Cashmere",
    note: "Brushed pure cashmere. Soft shoulder, soft hand, warm without weight.",
    selvedge: "Pure Cashmere · Mongolia",
    weight: "340\u00a0g",
    fromPrice: 390000,
    shades: [
      { id: "camel", name: "Camel", color: "#a17a4d" },
      { id: "slate", name: "Slate", color: "#4b5059" },
      { id: "ink", name: "Ink Navy", color: "#1b2236" },
      { id: "cocoa", name: "Cocoa", color: "#3e2c22" },
    ],
  },
  {
    id: "linen",
    name: "Linen",
    note: "Open plain weave with honest slubs. Cool in heat and better for every crease.",
    selvedge: "Irish Linen · Co. Down",
    weight: "310\u00a0g",
    fromPrice: 210000,
    shades: [
      { id: "ivory", name: "Ivory", color: "#d6ccb8" },
      { id: "sand", name: "Sand", color: "#b39f7e" },
      { id: "tobacco", name: "Tobacco", color: "#6d4b2e" },
      { id: "airforce", name: "Air Force Blue", color: "#566b80" },
    ],
  },
  {
    id: "velvet",
    name: "Velvet",
    note: "Cotton velvet with a deep pile. Drinks light at the centre, glows at the edge.",
    selvedge: "Cotton Velvet · Como",
    weight: "360\u00a0g",
    fromPrice: 280000,
    shades: [
      { id: "jet", name: "Jet", color: "#101013" },
      { id: "bottle", name: "Bottle Green", color: "#0f2f22" },
      { id: "burgundy", name: "Burgundy", color: "#47111c" },
      { id: "sapphire", name: "Sapphire", color: "#121d44" },
    ],
  },
];

export const LAPELS: { id: LapelId; name: string; note: string }[] = [
  { id: "notch", name: "Notch", note: "The everyday lapel. A clean step where collar meets lapel." },
  { id: "peak", name: "Peak", note: "Points rise toward the shoulder. Broadens the chest." },
  { id: "shawl", name: "Shawl", note: "One unbroken curve. Made for the evening." },
];

export const BUTTONS: { id: ButtonsId; name: string; note: string }[] = [
  { id: "one", name: "1 Button", note: "A long, deep opening. The dinner-jacket front." },
  { id: "two", name: "2 Buttons", note: "The standard. Fasten the top, leave the bottom." },
  { id: "three", name: "3 Buttons", note: "A higher closing and a shorter lapel." },
  { id: "double", name: "Double-Breasted", note: "6 buttons, 2 to fasten. Fronts wrap and overlap." },
];

export const BUTTON_FINISHES: { id: ButtonFinish; name: string }[] = [
  { id: "horn", name: "Dark Horn" },
  { id: "gold", name: "Brushed Gold" },
];

/** Surcharge for a double-breasted front, in minor units. */
export const DOUBLE_BREASTED_SURCHARGE = 25000;

export function getCloth(id: ClothId): Cloth {
  return CLOTHS.find((c) => c.id === id) ?? CLOTHS[0];
}

export function getShade(cloth: Cloth, shadeId: string | null | undefined): Shade {
  return cloth.shades.find((s) => s.id === shadeId) ?? cloth.shades[0];
}

/** The flagship: obsidian wool, peak lapel, brushed gold buttons. */
export const FLAGSHIP: SuitConfig = {
  cloth: "wool",
  color: "#16171b",
  pattern: "plain",
  lapel: "peak",
  buttons: "two",
  buttonFinish: "gold",
  satinLapel: false,
  jetted: false,
  neckwear: "tie",
  neckwearColor: "#7d6330",
  pocketSquare: true,
};

export function describeSuit(config: SuitConfig, shadeName: string): string {
  const cloth = getCloth(config.cloth).name;
  const lapel = LAPELS.find((l) => l.id === config.lapel)?.name ?? "";
  const buttons = BUTTONS.find((b) => b.id === config.buttons)?.name ?? "";
  const finish = BUTTON_FINISHES.find((f) => f.id === config.buttonFinish)?.name ?? "";
  return `${shadeName} ${cloth}, ${lapel} lapel, ${buttons}, ${finish} buttons`;
}
