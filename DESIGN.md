# Men Exclusives — Design System

The house is a tailor's shopfront at night: gold leaf on black glass, one lit
window, a suit on a form. Everything in the interface serves that picture.
Obsidian is the glass. Brushed gold is the metal. The cloth is the only thing
with texture.

This file is the source of truth. The tokens below are mirrored one-to-one in
`app/globals.css` (`@theme`), and the 3D lighting values are mirrored in
`components/suit/lighting.ts`.

## 1. Principles

1. **The suit is the loudest thing on every screen.** Interface chrome stays
   flat, thin and quiet so cloth, cut and light carry the page.
2. **Cold glass, warm metal.** Black is cool (blue-green undertone), gold is
   warm and desaturated. The temperature gap does the work a second accent
   colour would otherwise do. There is no second accent.
3. **Sharp edges.** Obsidian fractures to a blade; tailoring is cut with
   shears. Corners are square (0–2 px). Nothing is pill-shaped except the
   things that are round in the workshop: buttons on the jacket.
4. **Structure comes from the workroom.** A dashed line is a basting stitch and
   means *provisional*. A solid gold line is a finished seam and means
   *settled*. Cloth choices are pinked-edge swatches. Nothing else is decorated.
5. **Motion answers the customer.** Scroll turns the suit; a choice re-cuts
   it; a drawer opens. Nothing loops, nothing animates on its own.

## 2. Colour

| Token | Hex | Role |
| --- | --- | --- |
| `obsidian` | `#050607` | Page ground. The glass. |
| `basalt` | `#0C0F11` | Raised surface: drawers, dialogs, sticky bars. |
| `graphite` | `#161A1D` | Inset surface: inputs, cards, selected rows. |
| `line` | `#262B2F` | Hairline dividers (decorative only, never a control boundary). |
| `line-strong` | `#72777C` | Control boundaries: inputs, unselected options. |
| `chalk` | `#F0EADD` | Primary text. Tailor's chalk on dark cloth. |
| `ash` | `#A8A398` | Secondary text, captions, helper copy. |
| `gold` | `#C8A766` | The metal. Primary actions, selection, focus, links. |
| `gold-hi` | `#E8D29C` | Highlight of the brushed gradient, hover state of gold text. |
| `gold-deep` | `#8E7238` | Shadow of the brushed gradient. Never used for text. |
| `ember` | `#E8907A` | Errors only. |

### Contrast (WCAG 2.1)

| Foreground | on `obsidian` | on `basalt` | on `graphite` |
| --- | --- | --- | --- |
| `chalk` | 16.9 : 1 | 16.0 : 1 | 14.6 : 1 |
| `ash` | 8.1 : 1 | 7.7 : 1 | 7.0 : 1 |
| `gold` | 8.9 : 1 | 8.4 : 1 | 7.7 : 1 |
| `gold-hi` | 13.6 : 1 | 12.9 : 1 | 11.8 : 1 |
| `ember` | 8.4 : 1 | 8.0 : 1 | 7.3 : 1 |
| `line-strong` (non-text) | 4.5 : 1 | 4.3 : 1 | 3.9 : 1 |

`obsidian` text on a `gold` fill is 8.9 : 1. Body text is always `chalk` or
`ash`; both clear AAA on every surface. `line` is 1.4 : 1 and is therefore
never the only thing marking a control.

### Brushed gold

The brushed finish is reserved for the primary action and the selected state.
It is a three-stop gradient with a fine horizontal grain, not a flat fill:

```css
background-image:
  repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px),
  linear-gradient(100deg, #8E7238 0%, #C8A766 28%, #E8D29C 50%, #C8A766 72%, #8E7238 100%);
```

Text on brushed gold is `obsidian`. The darkest stop still gives 4.5 : 1; the
label always sits over the lighter middle of the gradient.

## 3. Typography

Two families, clearly distinct.

| Role | Family | Settings |
| --- | --- | --- |
| Display | **Noto Serif Display** (variable) | Weight 300, width 75 % (condensed). Tall and lean, like the silhouette it sells. Hairlines sharp enough to read as cut. |
| Text & UI | **Archivo** (variable) | Weight 400 / 500 / 600, width 100 %. Width 112 % for the small label style. |

Both are OFL-licensed and self-hosted from `app/fonts` through
`next/font/local` (no third-party font requests).

### Scale

A classical scale, fluid at the top end.

| Token | Size | Line height | Use |
| --- | --- | --- | --- |
| `display-xl` | `clamp(3.25rem, 8.2vw, 7.5rem)` | 0.95 | Hero headline only |
| `display-lg` | `clamp(2.5rem, 5.2vw, 4.5rem)` | 1.0 | Page titles, chapter headings |
| `display-md` | `clamp(1.875rem, 3.2vw, 2.75rem)` | 1.08 | Section headings |
| `display-sm` | `1.5rem` | 1.2 | Card titles, drawer titles |
| `body-lg` | `1.125rem` | 1.6 | Lead paragraphs |
| `body` | `1rem` | 1.6 | Default |
| `body-sm` | `0.875rem` | 1.5 | Helper text, captions |
| `label` | `0.8125rem` | 1.3 | Field labels, option names (weight 500, width 112 %) |

Rules:

- Headings and buttons use Title Case. Labels and helper text use sentence case.
- No tracked-out capitals. The one exception is the selvedge strip on a cloth
  swatch, because real selvedge lettering is woven that way.
- Headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty` and a
  measure of 60–68 characters.
- Prices, sizes, dates and times use `font-variant-numeric: tabular-nums`.
- Real typography only: `…`, curly quotes, non-breaking spaces between a
  number and its unit.

## 4. Space, Shape, Elevation

- **Spacing** follows a 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
  Sections are separated by 96–128 px on desktop, 64 px on mobile.
- **Page gutter** is `clamp(1.25rem, 4vw, 4rem)`; content maxes at 1440 px.
- **Radius** is `2px` for controls and `0` for surfaces. Round is reserved for
  jacket buttons, radio dots and the quantity badge.
- **Elevation** is never a soft grey shadow. A raised surface is `basalt` with
  a 1 px `line` edge; a modal surface adds a `rgb(0 0 0 / 0.72)` scrim.
- **Hit targets** are at least 44 × 44 px.

## 5. Motion

| Token | Value | Use |
| --- | --- | --- |
| `ease-cut` | `cubic-bezier(0.2, 0.7, 0.1, 1)` | Entrances, drawers, step changes |
| `ease-press` | `cubic-bezier(0.4, 0, 0.2, 1)` | Colour and opacity changes on hover/press |
| `dur-quick` | `160ms` | Hover, press, focus |
| `dur-move` | `420ms` | Drawers, dialogs, step transitions |

- Animate `transform` and `opacity` only. Never `transition: all`.
- The hero is scroll-linked through a spring (stiffness 90, damping 24), so it
  is always interruptible.
- Under `prefers-reduced-motion: reduce` the hero becomes a static sequence:
  the suit holds its final pose and the chapters stack as ordinary sections.
  Drawers and steps switch without travel.

## 6. Components

**Primary button.** Brushed gold fill, `obsidian` label, 48 px tall, 2 px
radius. Hover brightens; active dims. Label names the action
(“Add to Bag”, “Confirm Appointment”), never “Submit”.

**Secondary button.** Transparent, 1 px `line-strong` border, `chalk` label.
Hover moves the border and label to `gold-hi`.

**Text link.** `gold`, underlined with a 1 px offset rule. Hover is `gold-hi`.

**Focus.** Every interactive element shows a 2 px `gold-hi` ring with a 2 px
`obsidian` gap on `:focus-visible`. Compound controls (swatches, size chips,
calendar days) draw the ring on the visible tile, not the hidden input.

**Field.** `graphite` fill, 1 px `line-strong` border, label always visible
above. Errors appear directly under the field in `ember` with an icon and say
how to fix the problem.

**Option tile.** A native radio or checkbox with a styled label. Unselected:
`line-strong` border. Selected: `gold` border plus a second cue (a gold check
mark or a filled dot) so colour is never the only signal.

**Cloth swatch.** A pinked-edge rectangle carrying the real weave texture and
a selvedge strip with mill details. This is the only place the pinked edge
appears.

**Stitch line.** Dashed `chalk` at 40 % (the basting stitch) for steps that
are not yet settled; solid `gold` (the finished seam) once they are.

**Drawer and dialog.** Native `<dialog>`: focus is trapped, the page behind is
inert, `Esc` closes, focus returns to the trigger, scroll is contained.

**Pocket label.** The appointment confirmation is set as the label sewn inside
a bespoke jacket: the house name, “Cut expressly for”, the customer's name,
the date and a reference number.

## 7. The Suit (3D)

The suit is generated in code (`components/suit`), so cloth, lapel and button
choices change real geometry and materials rather than swapping pictures.

- **Cloths:** Italian wool (fine twill), cashmere (soft nap), linen (open
  plain weave with slubs), velvet (deep pile). Each is a procedural texture
  with its own bump map, roughness and sheen.
- **Stage:** obsidian void, no visible floor. The form stands on a brushed
  brass pole.
- **Lights:** a warm key (`#FFF0DC`), a cool rim (`#9FC4FF`) and a gold kicker
  (`#C8A766`). The hero moves between four lighting states as the customer
  scrolls: *Silhouette* (rim only), *Cloth* (raking key that shows the weave),
  *Cut* (cool profile light on the shoulder line) and *Finish* (full warm key).
- **Stills:** catalogue and fallback images are rendered from the same model
  with `npm run render:stills`, so product imagery always matches the live suit.
- If WebGL is unavailable the page shows the rendered still instead.

## 8. Voice

Plain, exact, unhurried. Speak to the customer in the second person and say
what will happen: “Choose a time”, “Add to Bag”, “That time was just taken.
Choose another.” Use numerals for counts and measurements. No exclamation
marks, no superlatives about ourselves.

## 9. Accessibility Floor

- WCAG 2.1 AA throughout; text contrast is AAA by construction (see §2).
- One `<h1>` per page, headings in order, landmarks present, a skip link first
  in the tab order.
- Every control is reachable and operable by keyboard. Dragging the suit has
  button equivalents (“Front”, “Side”, “Back”).
- The 3D canvas is exposed as an image with a text description of the current
  configuration; changes are announced through a polite live region.
- Dates, times and prices are formatted with `Intl`.
- `npm run audit` runs axe-core and layout/console checks across every route
  at desktop and mobile widths.
