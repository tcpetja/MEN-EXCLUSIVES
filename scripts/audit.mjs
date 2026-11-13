/**
 * Quality and visual audit.
 *
 *   npm run dev      (in another terminal, or point --base at a deployment)
 *   npm run audit    [-- --base=http://localhost:3000] [--shots=<dir>]
 *
 * For every route, at desktop and mobile widths, this checks:
 *   - axe-core against WCAG 2.2 A/AA (colour contrast included) and best practices
 *   - console errors, uncaught exceptions and failed requests
 *   - horizontal overflow and elements wider than the viewport
 * Then it drives the main flows (filtering, sizing, bag, customizer, booking,
 * hero scroll, reduced motion, keyboard) and asserts what the customer sees.
 *
 * Exits non-zero if anything fails.
 */
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
// Playwright may be installed in the project or globally; require() finds either.
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");

const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const base = arg("base", "http://localhost:3000");
const shots = arg("shots", null);
// --only=routes,filters,bag,customizer,booking,hero,reduced,keyboard  --viewport=desktop|mobile
const only = arg("only", null)?.split(",") ?? null;
const run = (section) => !only || only.includes(section);
const viewportFilter = arg("viewport", null);

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const ROUTES = [
  { path: "/", name: "home", webgl: true },
  { path: "/bespoke", name: "bespoke", webgl: true },
  { path: "/collection", name: "collection" },
  { path: "/collection?line=black-tie&cloth=velvet", name: "collection-filtered" },
  { path: "/collection?line=wedding&cloth=velvet", name: "collection-empty" },
  { path: "/collection/tuxedo-shawl", name: "product" },
  { path: "/book", name: "book" },
  { path: "/checkout", name: "checkout" },
  { path: "/this-page-does-not-exist", name: "not-found", expectStatus: 404 },
];

// Third-party notices that are not defects in this app.
const IGNORED_CONSOLE = [
  /THREE\.Clock: This module has been deprecated/, // raised inside @react-three/fiber
  /Download the React DevTools/,
  /\[HMR\]|\[Fast Refresh\]/,
  /GPU stall due to ReadPixels/, // software WebGL in headless Chromium
  /Automatic fallback to software WebGL has been deprecated/,
  /You have Reduced Motion enabled on your device/, // Framer Motion's development-only notice
];

const ACTIVE_VIEWPORTS = VIEWPORTS.filter((v) => !viewportFilter || v.name === viewportFilter);

const failures = [];
const notes = [];
const fail = (where, message) => {
  failures.push(`${where}: ${message}`);
  console.log(`  ✗ ${where}: ${message}`);
};
const pass = (message) => console.log(`  ✓ ${message}`);

function check(where, condition, message) {
  if (condition) pass(message);
  else fail(where, message);
}

const browser = await chromium.launch({
  // software WebGL, so the 3D scenes render on machines without a GPU
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
if (shots) await mkdir(shots, { recursive: true });

async function open(viewport, options = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    hasTouch: viewport.name === "mobile",
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    const text = m.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    // the browser logs the page's own expected status (the 404 route) as an error
    if (options.allowStatus?.some((code) => text.includes(`status of ${code}`))) return;
    problems.push(`console.${m.type()}: ${text.slice(0, 300)}`);
  });
  page.on("pageerror", (e) => problems.push(`uncaught: ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => {
    const reason = r.failure()?.errorText ?? "";
    // navigations and prefetches cancelled by the next action are expected
    if (/ERR_ABORTED/.test(reason)) return;
    problems.push(`request failed: ${r.url()} ${reason}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !options.allowStatus?.includes(r.status()))
      problems.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  return { context, page, problems };
}

async function settle(page, webgl = false) {
  await page.waitForLoadState("networkidle").catch(() => {});
  if (webgl) await page.waitForSelector("canvas", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(webgl ? 2500 : 500);
}

async function runAxe(page, where) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const r = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      resultTypes: ["violations", "incomplete"],
    });
    const brief = (list) =>
      list.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary ?? "").slice(0, 240) })),
        count: v.nodes.length,
      }));
    return { violations: brief(r.violations), incomplete: brief(r.incomplete) };
  });
  if (result.violations.length === 0) pass(`${where}: axe, 0 violations`);
  for (const v of result.violations) {
    fail(where, `axe ${v.id} (${v.impact}, ${v.count} node${v.count > 1 ? "s" : ""}): ${v.help}`);
    for (const n of v.nodes) console.log(`      ${n.target}\n        ${n.summary.replaceAll("\n", " ")}`);
  }
  for (const v of result.incomplete) {
    notes.push(`${where}: axe could not decide "${v.id}" on ${v.count} node(s), e.g. ${v.nodes[0]?.target}`);
  }
}

async function checkLayout(page, where) {
  const layout = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest("dialog:not([open])")) continue;
      const style = getComputedStyle(el);
      if (style.position === "fixed" && style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // inside a horizontal scroller, running past the edge is the design
      let scroller = el.parentElement;
      let inScroller = false;
      while (scroller && scroller !== document.body) {
        const o = getComputedStyle(scroller).overflowX;
        if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") {
          inScroller = true;
          break;
        }
        scroller = scroller.parentElement;
      }
      if (!inScroller && (r.right > vw + 1 || r.left < -1)) {
        wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
    return {
      vw,
      scrollWidth: document.documentElement.scrollWidth,
      wide: wide.slice(0, 5),
      h1: document.querySelectorAll("h1").length,
      imagesWithoutSize: [...document.images].filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length,
      imagesWithoutAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
      brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc),
    };
  });
  check(where, layout.scrollWidth <= layout.vw, `${where}: no horizontal scroll (${layout.scrollWidth} ≤ ${layout.vw})`);
  check(where, layout.wide.length === 0, `${where}: nothing overflows the viewport${layout.wide.length ? ` — ${layout.wide.join("; ")}` : ""}`);
  check(where, layout.h1 === 1, `${where}: exactly one h1 (found ${layout.h1})`);
  check(where, layout.imagesWithoutSize === 0 && layout.imagesWithoutAlt === 0, `${where}: every image has dimensions and alt`);
  check(where, layout.brokenImages.length === 0, `${where}: no broken images${layout.brokenImages.length ? ` — ${layout.brokenImages.join(", ")}` : ""}`);
}

const snap = async (page, name) => {
  if (shots) await page.screenshot({ path: path.join(shots, `${name}.png`) });
};

function report(where, problems) {
  check(where, problems.length === 0, `${where}: no console errors, exceptions or failed requests`);
  for (const p of problems) console.log(`      ${p}`);
  problems.length = 0;
}

/* ------------------------------------------------------------------ */
/* 1. Every route, both widths                                         */
/* ------------------------------------------------------------------ */

for (const viewport of run("routes") ? ACTIVE_VIEWPORTS : []) {
  console.log(`\n── Routes at ${viewport.name} (${viewport.width}×${viewport.height}) ──`);
  for (const route of ROUTES) {
    const where = `${route.name}@${viewport.name}`;
    const { context, page, problems } = await open(viewport, {
      allowStatus: route.expectStatus ? [route.expectStatus] : [],
    });
    const response = await page.goto(base + route.path, { waitUntil: "load" });
    if (route.expectStatus) check(where, response.status() === route.expectStatus, `${where}: responds ${route.expectStatus}`);
    await settle(page, route.webgl);
    await checkLayout(page, where);
    await runAxe(page, where);
    report(where, problems);
    await snap(page, where);
    await context.close();
  }
}

/* ------------------------------------------------------------------ */
/* 2. Flows                                                            */
/* ------------------------------------------------------------------ */

for (const viewport of ACTIVE_VIEWPORTS) {
  const at = `@${viewport.name}`;

  if (run("filters")) {
    console.log(`\n── Collection filters ${at} ──`);
    const { context, page, problems } = await open(viewport);
    await page.goto(`${base}/collection`);
    await settle(page);
    const count = () => page.locator("main li a[href^='/collection/']").count();
    check(`filters${at}`, (await count()) === 12, "collection shows all 12 suits");
    await page.getByRole("link", { name: "Black Tie Tuxedo", exact: true }).click();
    await page.waitForURL(/line=black-tie/);
    await page.waitForTimeout(400);
    check(`filters${at}`, (await count()) === 3, "line filter narrows to 3 suits and updates the URL");
    await page.getByRole("link", { name: "Velvet", exact: true }).click();
    await page.waitForURL(/cloth=velvet/);
    await page.waitForTimeout(400);
    check(`filters${at}`, (await count()) === 1, "cloth filter narrows to 1 suit");
    check(`filters${at}`, /1 suit match/.test(await page.getByRole("status").first().innerText()), "result count is announced");
    await page.getByRole("link", { name: "Price, Low to High" }).click();
    await page.waitForURL(/sort=price-asc/);
    await page.goBack().catch(() => {});
    report(`filters${at}`, problems);
    await context.close();
  }

  if (run("bag")) {
    console.log(`\n── Size, bag and size guide ${at} ──`);
    const { context, page, problems } = await open(viewport);
    await page.goto(`${base}/collection/executive-midnight`);
    await settle(page);
    const add = page.getByRole("button", { name: /Add .*to Bag|Add to Bag/ });
    await add.click();
    await page.waitForTimeout(200);
    check(`bag${at}`, await page.getByText("Choose a chest size").isVisible(), "adding without a size shows an inline error");
    check(`bag${at}`, await page.evaluate(() => document.activeElement?.getAttribute("name") === "chest"), "focus moves to the chest sizes");

    // size guide
    const guideTrigger = page.getByRole("button", { name: "Size Guide" });
    await guideTrigger.click();
    const guide = page.getByRole("dialog", { name: "Size Guide" });
    await guide.waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    await guide.getByText("Centimetres").click();
    check(`bag${at}`, (await guide.locator("tbody tr").first().innerText()).includes("91"), "size guide converts inches to centimetres");
    await runAxe(page, `size-guide${at}`);
    await snap(page, `size-guide${at}`);
    await page.keyboard.press("Escape");
    await guide.waitFor({ state: "hidden" });
    check(`bag${at}`, await guideTrigger.evaluate((el) => el === document.activeElement), "closing the size guide returns focus to its trigger");

    // choose 40 Regular and add
    await page.locator("label", { hasText: /^40$/ }).click();
    await page.waitForURL(/size=40R/);
    check(`bag${at}`, true, "chosen size is written to the URL");
    await page.getByRole("button", { name: "Add Size 40R to Bag" }).click();
    const bag = page.getByRole("dialog", { name: /Your Bag/ });
    await bag.waitFor({ state: "visible" });
    await page.waitForTimeout(600);
    check(`bag${at}`, (await bag.locator("li").count()) === 1, "bag drawer opens with the suit in it");
    await bag.getByRole("button", { name: /Increase quantity/ }).click();
    check(`bag${at}`, (await bag.getByLabel("Quantity 2").count()) === 1, "quantity increases to 2");
    check(`bag${at}`, (await bag.getByText("$3,700").count()) >= 1, "subtotal follows the quantity");
    await runAxe(page, `bag-drawer${at}`);
    await snap(page, `bag-drawer${at}`);
    await bag.getByRole("button", { name: /^Remove/ }).click();
    await page.waitForTimeout(500);
    check(`bag${at}`, await bag.getByRole("button", { name: "Undo" }).isVisible(), "removing a line offers Undo");
    await bag.getByRole("button", { name: "Undo" }).click();
    await page.waitForTimeout(400);
    check(`bag${at}`, (await bag.locator("li").count()) === 1, "Undo puts the suit back");
    await page.keyboard.press("Escape");
    await bag.waitFor({ state: "hidden" });
    await page.reload();
    await settle(page);
    check(`bag${at}`, /2 items/.test((await page.getByRole("button", { name: /Open bag/ }).getAttribute("aria-label")) ?? ""), "bag survives a reload");
    await page.goto(`${base}/checkout`);
    await settle(page);
    check(`bag${at}`, await page.getByText("Payment Is Not Connected Yet").isVisible(), "checkout lists the bag and says payment is not connected");
    await runAxe(page, `checkout-with-items${at}`);
    report(`bag${at}`, problems);
    await context.close();
  }

  if (run("customizer")) {
    console.log(`\n── Customizer ${at} ──`);
    const { context, page, problems } = await open(viewport);
    await page.goto(`${base}/bespoke`);
    await settle(page, true);
    const status = page.locator("main p[role=status]");
    for (const [label, param, expected] of [
      ["Cashmere", "cloth=cashmere", /Camel Cashmere/],
      ["Linen", "cloth=linen", /Ivory Linen/],
      ["Velvet", "cloth=velvet", /Jet Velvet/],
      ["Shawl", "lapel=shawl", /Shawl lapel/],
      ["Notch", "lapel=notch", /Notch lapel/],
      ["Double-Breasted", "buttons=double", /Double-Breasted/],
      ["3 Buttons", "buttons=three", /3 Buttons/],
      ["Dark Horn", "finish=horn", /Dark Horn buttons/],
    ]) {
      await page.locator("label", { hasText: label }).first().click();
      await page.waitForURL(new RegExp(param));
      await page.waitForTimeout(700);
      const text = await status.innerText();
      check(`customizer${at}`, expected.test(text), `choosing ${label} updates the suit, the URL and the announcement`);
    }
    await page.locator("label[title='Burgundy']").click();
    await page.waitForURL(/shade=burgundy/);
    await page.waitForTimeout(900);
    for (const angle of ["Back", "Side", "Front"]) {
      await page.getByRole("button", { name: angle, exact: true }).click();
      await page.waitForTimeout(900);
    }
    check(`customizer${at}`, (await page.getByRole("button", { name: "Front", exact: true }).getAttribute("aria-pressed")) === "true", "angle buttons turn the suit from the keyboard");
    await page.getByRole("button", { name: "Close-Up" }).click();
    await page.waitForTimeout(1200);
    await snap(page, `customizer-velvet-closeup${at}`);
    const canvasPainted = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return Boolean(c && c.width > 0 && c.height > 0);
    });
    check(`customizer${at}`, canvasPainted, "3D canvas is live");
    const bookHref = await page.getByRole("link", { name: "Book a Measurement" }).getAttribute("href");
    check(`customizer${at}`, /service=measurement&cut=.*Velvet/.test(decodeURIComponent(bookHref ?? "")), "the design is carried into the booking link");
    await runAxe(page, `customizer-changed${at}`);
    report(`customizer${at}`, problems);
    await context.close();
  }

  if (run("booking")) {
    console.log(`\n── Booking flow ${at} ──`);
    const { context, page, problems } = await open(viewport, { allowStatus: [409] });
    await page.goto(`${base}/book?cut=${encodeURIComponent("Obsidian Italian Wool, Peak lapel")}`);
    await settle(page);
    const where = `booking${at}`;
    await page.getByRole("button", { name: "Choose a Date" }).click();
    check(where, await page.getByText("Choose the appointment you need").isVisible(), "step 1 will not continue without a service");
    await page.locator("label", { hasText: "First Measurement" }).click();
    await page.waitForURL(/service=measurement/);
    await runAxe(page, `booking-step1${at}`);
    await page.getByRole("button", { name: "Choose a Date" }).click();
    await page.getByRole("heading", { name: "Choose a Date & Time" }).waitFor();
    await page.waitForTimeout(500);
    check(where, await page.evaluate(() => document.activeElement?.tagName === "H2"), "focus moves to the heading of the new step");

    // keyboard: arrow keys move through the calendar
    const today = page.locator("button[aria-current='date']");
    await today.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(250);
    check(where, await page.evaluate(() => document.activeElement?.hasAttribute("data-date") && document.activeElement?.getAttribute("aria-current") !== "date"), "arrow keys move between days");

    // pick the first open day that has a free time
    let picked = false;
    for (let attempt = 0; attempt < 12 && !picked; attempt++) {
      const days = page.locator("button[data-date]:not([aria-disabled])");
      const n = await days.count();
      if (attempt >= n) {
        await page.getByRole("button", { name: "Next month" }).click();
        await page.waitForTimeout(200);
        continue;
      }
      await days.nth(attempt).click();
      await page.waitForURL(/date=/);
      await page
        .locator("input[name=time]")
        .first()
        .or(page.getByText("Every time on this day is taken"))
        .waitFor({ state: "attached", timeout: 15_000 });
      const free = page.locator("label:has(input[name=time]:not([disabled]))");
      if ((await free.count()) > 0) {
        await free.first().click();
        await page.waitForURL(/time=/);
        picked = true;
      }
    }
    check(where, picked, "a date and a free time can be chosen; taken times are disabled");
    await runAxe(page, `booking-step2${at}`);
    await snap(page, `booking-step2${at}`);
    await page.getByRole("button", { name: "Enter Your Details" }).click();
    await page.getByRole("heading", { name: "Your Details" }).waitFor();
    await page.waitForTimeout(500);
    check(where, (await page.locator("#notes").inputValue()).includes("Obsidian Italian Wool"), "the bespoke design is prefilled in the notes");

    await page.getByRole("button", { name: "Review Appointment" }).click();
    await page.waitForTimeout(200);
    check(where, (await page.locator("[id$='-error']").count()) === 3, "empty details show 3 inline errors");
    check(where, await page.evaluate(() => document.activeElement?.id === "name"), "focus moves to the first field with an error");
    check(where, (await page.locator("#name").getAttribute("aria-invalid")) === "true", "invalid fields are marked for assistive technology");
    await runAxe(page, `booking-step3-errors${at}`);
    await snap(page, `booking-step3-errors${at}`);
    await page.fill("#name", "Alex Morgan");
    await page.fill("#email", "alex@example.com");
    await page.fill("#phone", "+1 555 010 0199");
    await page.getByRole("button", { name: "Review Appointment" }).click();
    await page.getByRole("heading", { name: "Review Your Appointment" }).waitFor();
    await page.waitForTimeout(500);
    await runAxe(page, `booking-step4${at}`);
    await page.getByRole("button", { name: "Confirm Appointment" }).click();
    await page.getByRole("heading", { name: "Your Appointment Is Confirmed" }).waitFor({ timeout: 15_000 });
    check(where, /ME-\d{6}-\d{4}/.test(await page.locator("main").innerText()), "confirmation shows a reference");
    await runAxe(page, `booking-confirmed${at}`);
    await snap(page, `booking-confirmed${at}`);

    // the same slot cannot be booked twice
    const slotUrl = new URL(page.url());
    const second = await page.request.post(`${base}/api/appointments`, {
      data: {
        service: "measurement",
        date: slotUrl.searchParams.get("date"),
        time: slotUrl.searchParams.get("time"),
        name: "Sam Lee",
        email: "sam@example.com",
        phone: "5550100200",
        notes: "",
      },
    });
    check(where, second.status() === 409, "booking the same time again is refused (409)");
    report(where, problems);
    await context.close();
  }

  if (run("hero")) {
    console.log(`\n── Hero scroll ${at} ──`);
    const { context, page, problems } = await open(viewport);
    await page.goto(base);
    await settle(page, true);
    const where = `hero${at}`;
    const range = await page.evaluate(() => {
      const track = document.querySelector("main section");
      return track.offsetHeight - window.innerHeight;
    });
    const visibleHeading = () =>
      page.evaluate(() => {
        const track = document.querySelector("main section");
        return [...track.querySelectorAll("h1, h2")]
          .filter((h) => Number(getComputedStyle(h.parentElement).opacity) > 0.9)
          .map((h) => h.textContent);
      });
    check(where, (await visibleHeading()).join() === "Cut for One Man at a Time", "hero opens on the headline");
    const expected = ["The Cloth", "The Cut", "The Finish"];
    for (let i = 1; i <= 3; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), (range * i) / 3);
      await page.waitForTimeout(2600);
      const seen = await visibleHeading();
      check(where, seen.join() === expected[i - 1], `scrolling shows “${expected[i - 1]}” (saw: ${seen.join(", ") || "none"})`);
      await snap(page, `hero-${i}${at}`);
    }
    await checkLayout(page, `hero-scrolled${at}`);
    report(where, problems);
    await context.close();
  }

  if (run("reduced")) {
    console.log(`\n── Reduced motion ${at} ──`);
    const { context, page, problems } = await open(viewport, { reducedMotion: true });
    await page.goto(base);
    await settle(page, true);
    const where = `reduced-motion${at}`;
    const state = await page.evaluate(() => {
      const track = document.querySelector("main section");
      const headings = [...track.querySelectorAll("h1, h2")];
      return {
        sticky: getComputedStyle(track.firstElementChild).position,
        allVisible: headings.every((h) => Number(getComputedStyle(h.parentElement).opacity) === 1),
        stacked: headings.every((h, i) => i === 0 || h.getBoundingClientRect().top > headings[i - 1].getBoundingClientRect().bottom),
        trackHeight: track.offsetHeight,
        viewport: window.innerHeight,
      };
    });
    check(where, state.sticky === "static", "hero is not pinned");
    check(where, state.allVisible && state.stacked, "all four chapters are visible and stacked in reading order");
    check(where, state.trackHeight < state.viewport * 4, "the long scroll track is removed");
    await checkLayout(page, where);
    await runAxe(page, where);
    await snap(page, where);
    report(where, problems);
    await context.close();
  }
}

if (run("keyboard")) {
  console.log("\n── Keyboard ──");
  const { context, page, problems } = await open(VIEWPORTS[0]);
  await page.goto(`${base}/collection`);
  await settle(page);
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("keyboard", first === "Skip to Main Content", "the first Tab stop is the skip link");
  const visible = await page.evaluate(() => {
    const r = document.activeElement.getBoundingClientRect();
    return r.width > 40 && r.height > 20 && r.top >= 0;
  });
  check("keyboard", visible, "the skip link is visible when focused");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  check("keyboard", await page.evaluate(() => document.activeElement?.id === "main"), "the skip link moves focus to the main content");

  // every focusable element shows a focus indicator
  await page.goto(`${base}/collection/tuxedo-shawl`);
  await settle(page);
  const missing = [];
  for (let i = 0; i < 28; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const ring = (node) => {
        const s = getComputedStyle(node);
        return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
      };
      // radios are visually hidden; their tile draws the ring
      const shown = ring(el) || Boolean(el.closest("label") && ring(el.closest("label")));
      return { shown, name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || el.tagName).trim().slice(0, 40) };
    });
    if (info && !info.shown) missing.push(info.name);
  }
  check("keyboard", missing.length === 0, `every Tab stop shows a visible focus ring${missing.length ? ` — missing on: ${missing.join(", ")}` : ""}`);
  report("keyboard", problems);
  await context.close();
}

await browser.close();

console.log("\n── Summary ──");
if (notes.length) {
  console.log("Needs a human look (axe could not decide automatically):");
  for (const n of [...new Set(notes)]) console.log(`  • ${n}`);
}
if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log("\nAll checks passed.");
