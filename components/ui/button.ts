const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-control px-6 text-[0.875rem] font-medium [font-stretch:108%] select-none whitespace-nowrap disabled:pointer-events-none disabled:opacity-45";

/** Button looks from DESIGN.md §6. Apply to <button> or <Link>. */
export const button = {
  primary: `${base} brushed-gold hover:brightness-110 active:brightness-95`,
  secondary: `${base} border border-line-strong text-chalk hover:border-gold-hi hover:text-gold-hi active:bg-graphite`,
  quiet: `${base} px-3 text-chalk hover:text-gold-hi active:text-gold`,
} as const;

/** A square 44 px icon button. */
export const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-control text-chalk hover:bg-graphite hover:text-gold-hi active:text-gold disabled:pointer-events-none disabled:opacity-40";
