/** House details. Placeholder values: replace before launch. */
export const SITE = {
  name: "Men Exclusives",
  tagline: "Bespoke tailoring and ready-to-wear suits",
  description:
    "Bespoke suits cut by hand, a ready-to-wear collection, and fittings by appointment. Design your suit in 3D, then book your measurement.",
  locale: "en-US",
  currency: "USD",
  atelier: {
    name: "The Atelier",
    street: "14 Tailor’s Row, First Floor",
    hours: "Monday to Saturday, 10:00 to 18:00",
    email: "atelier@menexclusives.example",
  },
} as const;

export const NAV = [
  { href: "/bespoke", label: "Bespoke" },
  { href: "/collection", label: "Collection" },
  { href: "/book", label: "Book a Fitting" },
] as const;
