# Men Exclusives

A bespoke suit house on the web: a scroll-driven 3D showcase of the flagship
suit, a live fabric and cut customizer, a ready-to-wear collection with a bag,
and appointment booking for measurements, fittings and alterations.

Built with Next.js 16 (App Router, Cache Components), Tailwind CSS 4,
Framer Motion and Three.js through React Three Fiber. The design system lives
in [`DESIGN.md`](./DESIGN.md).

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run audit` | Accessibility, console and layout audit across every route and flow |
| `npm run render:stills` | Re-photographs every catalogue suit from the 3D model |

`audit` and `render:stills` drive a real browser with
[Playwright](https://playwright.dev). They need the dev server running, and
Playwright with Chromium available (`npm i -D playwright` then
`npx playwright install chromium`, if it is not already on the machine).

## Where things are

```
app/
  page.tsx                 Home: hero showcase, cloths, lines, fittings
  bespoke/                 Fabric and cut customizer
  collection/              Catalogue grid with filters; [slug] product pages
  book/                    Four-step appointment booking
  checkout/                Bag summary (payment is not connected)
  api/availability         Free times for a day
  api/appointments         Creates an appointment
  studio/                  Bare stage used to photograph the suits
components/
  suit/                    The suit, cut in code
    geometry.ts              body block, fronts, lapels, collar, sleeves, pockets
    weaves.ts, fabrics.ts    procedural wool, cashmere, linen and velvet
    lighting.ts              studio and hero lighting states
    SuitModel.tsx, Stage.tsx materials, lights, canvas
  hero/ customizer/ catalog/ cart/ booking/ site/ ui/
lib/
  products.ts              The 12 suits, sizes and size chart
  booking.ts               Services, opening hours, validation
  booking-store.ts         In-memory appointment store (replace with a real one)
  site.ts                  Name, address, hours, locale and currency
scripts/
  render-stills.mjs        3D model → public/suits/*.webp
  audit.mjs                axe-core + console + layout + flow checks
```

## What is real and what is a stand-in

- **The suit is generated, not downloaded.** Lapel and button choices re-cut
  geometry; cloth choices swap procedural textures. Product photographs are
  rendered from the same model, so they always match.
- **Appointments are held in server memory.** They vanish on restart and are
  not shared between server instances. Some times are marked as taken by a
  fixed rule so the calendar behaves like a busy one. No email is sent.
  Replace `lib/booking-store.ts` with your calendar or database.
- **Checkout stops at the bag summary.** No payment provider is connected.
- **The bag is stored in the browser** (`localStorage`).
- **Address, email, prices, currency and product copy are placeholders** in
  `lib/site.ts` and `lib/products.ts`.
