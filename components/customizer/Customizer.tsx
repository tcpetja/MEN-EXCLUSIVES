"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { ClothSwatch } from "@/components/suit/ClothSwatch";
import {
  BUTTONS,
  BUTTON_FINISHES,
  CLOTHS,
  DOUBLE_BREASTED_SURCHARGE,
  LAPELS,
  describeSuit,
  getCloth,
  getShade,
  type ButtonFinish,
  type ButtonsId,
  type ClothId,
  type LapelId,
  type SuitConfig,
} from "@/components/suit/config";
import { CheckIcon } from "@/components/ui/Icons";
import { button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { ButtonDiagram, LapelDiagram } from "./diagrams";

const SuitViewer = dynamic(() => import("./SuitViewer"), {
  ssr: false,
  loading: () => <p className="flex h-full items-center justify-center text-body-sm text-ash">Loading the suit…</p>,
});

/** A dark tie on pale cloth, the house gold on dark cloth. */
function tieFor(color: string) {
  const n = parseInt(color.slice(1), 16);
  const luma = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return luma > 0.38 ? "#3a2a20" : "#7d6330";
}

const tile =
  "relative flex cursor-pointer border border-line-strong rounded-control hover:border-gold-hi has-checked:border-gold has-checked:bg-graphite has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-hi";

function Check() {
  return (
    <CheckIcon className="absolute top-2 right-2 text-gold opacity-0 peer-checked:opacity-100" width={18} height={18} />
  );
}

function Group({ legend, value, children }: { legend: string; value: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-6 pb-8">
      <legend className="float-left mb-4 flex w-full items-baseline justify-between gap-4">
        <span className="type-display text-display-sm text-chalk">{legend}</span>
        <span className="type-label min-w-0 truncate text-gold">{value}</span>
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function Customizer() {
  const params = useSearchParams();

  const cloth = getCloth(params.get("cloth") as ClothId);
  const shade = getShade(cloth, params.get("shade"));
  const lapel = LAPELS.find((l) => l.id === params.get("lapel")) ?? LAPELS[1];
  const buttons = BUTTONS.find((b) => b.id === params.get("buttons")) ?? BUTTONS[1];
  const finish = BUTTON_FINISHES.find((f) => f.id === params.get("finish")) ?? BUTTON_FINISHES[1];

  // The URL holds the design, so a link to this page is a link to this suit.
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    window.history.replaceState(null, "", `?${next.toString()}`);
  };

  const config: SuitConfig = {
    cloth: cloth.id,
    color: shade.color,
    pattern: shade.pattern ?? "plain",
    lapel: lapel.id,
    buttons: buttons.id,
    buttonFinish: finish.id,
    satinLapel: false,
    jetted: false,
    neckwear: "tie",
    neckwearColor: tieFor(shade.color),
    pocketSquare: true,
  };

  const description = describeSuit(config, shade.name);
  const price = cloth.fromPrice + (buttons.id === "double" ? DOUBLE_BREASTED_SURCHARGE : 0);
  const unusual = buttons.id === "double" && lapel.id === "notch";

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(26rem,0.8fr)]">
      <div className="sticky top-header z-10 h-[46svh] border-b border-line bg-obsidian bg-[radial-gradient(52%_50%_at_50%_42%,rgb(200_167_102/0.1),transparent_72%)] lg:h-[calc(100svh-var(--spacing-header))] lg:border-r lg:border-b-0">
        <SuitViewer
          config={config}
          description={description}
          fallback={
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Image
                src="/suits/executive-obsidian.webp"
                alt="A two-button suit in obsidian wool on a tailor’s form."
                width={960}
                height={1200}
                className="h-[70%] w-auto"
              />
              <p className="max-w-[40ch] text-body-sm text-ash">
                The live 3D preview needs WebGL, which this browser has turned off. Your choices are
                still recorded and sent with your booking.
              </p>
            </div>
          }
        />
      </div>

      <div className="px-gutter pt-10 pb-16 lg:pt-14">
        <h1 className="type-display text-display-lg">Design Your Suit</h1>
        <p className="mt-4 mb-10 max-w-[52ch] text-body-lg text-ash">
          Choose the cloth, the lapel and the buttons. The suit changes as you decide, and the
          design travels with you to your measurement.
        </p>

        <Group legend="Cloth" value={cloth.name}>
          <div className="grid grid-cols-2 gap-3">
            {CLOTHS.map((c) => (
              <label key={c.id} className={`${tile} flex-col p-3`}>
                <input
                  type="radio"
                  name="cloth"
                  value={c.id}
                  checked={c.id === cloth.id}
                  onChange={() => update({ cloth: c.id, shade: null })}
                  className="peer sr-only"
                />
                <span className="relative block">
                  <ClothSwatch cloth={c.id} color={c.shades[0].color} pattern={c.shades[0].pattern} pinked className="aspect-[5/3] w-full" />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-[6px] flex justify-between gap-2 overflow-hidden bg-chalk px-1.5 py-px text-[0.5625rem] leading-tight font-semibold tracking-[0.12em] whitespace-nowrap text-obsidian uppercase"
                  >
                    {c.selvedge.split(" · ").map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                  </span>
                </span>
                <span className="mt-3 block text-body-sm font-medium text-chalk">{c.name}</span>
                <span className="tabular block text-body-sm text-ash">
                  {c.weight}, from {formatPrice(c.fromPrice)}
                </span>
                <Check />
              </label>
            ))}
          </div>
          <p className="mt-4 max-w-[52ch] text-body-sm text-ash">{cloth.note}</p>
        </Group>

        <Group legend="Shade" value={shade.name}>
          <div className="flex flex-wrap gap-3">
            {cloth.shades.map((s) => (
              <label key={s.id} className={`${tile} size-16 p-1`} title={s.name}>
                <input
                  type="radio"
                  name="shade"
                  value={s.id}
                  checked={s.id === shade.id}
                  onChange={() => update({ shade: s.id })}
                  className="peer sr-only"
                />
                <ClothSwatch cloth={cloth.id} color={s.color} pattern={s.pattern} className="size-full" />
                <span className="sr-only">{s.name}</span>
                <span className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full bg-gold text-obsidian peer-checked:flex">
                  <CheckIcon width={14} height={14} strokeWidth={2} />
                </span>
              </label>
            ))}
          </div>
        </Group>

        <Group legend="Lapel" value={lapel.name}>
          <div className="grid grid-cols-3 gap-3">
            {LAPELS.map((l) => (
              <label key={l.id} className={`${tile} flex-col items-center px-2 pt-4 pb-3 text-chalk`}>
                <input
                  type="radio"
                  name="lapel"
                  value={l.id}
                  checked={l.id === lapel.id}
                  onChange={() => update({ lapel: l.id satisfies LapelId })}
                  className="peer sr-only"
                />
                <LapelDiagram lapel={l.id} />
                <span className="mt-2 text-body-sm font-medium">{l.name}</span>
                <Check />
              </label>
            ))}
          </div>
          <p className="mt-4 max-w-[52ch] text-body-sm text-ash">{lapel.note}</p>
        </Group>

        <Group legend="Buttons" value={buttons.name}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {BUTTONS.map((b) => (
              <label key={b.id} className={`${tile} flex-col items-center px-2 pt-4 pb-3 text-chalk`}>
                <input
                  type="radio"
                  name="buttons"
                  value={b.id}
                  checked={b.id === buttons.id}
                  onChange={() => update({ buttons: b.id satisfies ButtonsId })}
                  className="peer sr-only"
                />
                <ButtonDiagram buttons={b.id} />
                <span className="mt-2 text-center text-body-sm font-medium">{b.name}</span>
                <Check />
              </label>
            ))}
          </div>
          <p className="mt-4 max-w-[52ch] text-body-sm text-ash">{buttons.note}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {BUTTON_FINISHES.map((f) => (
              <label key={f.id} className={`${tile} h-12 items-center gap-3 pr-10 pl-3 text-body-sm text-chalk`}>
                <input
                  type="radio"
                  name="finish"
                  value={f.id}
                  checked={f.id === finish.id}
                  onChange={() => update({ finish: f.id satisfies ButtonFinish })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`size-5 rounded-full border border-line-strong ${f.id === "gold" ? "brushed-gold" : "bg-[#1d1814]"}`}
                />
                {f.name}
                <Check />
              </label>
            ))}
          </div>
        </Group>

        <div className="border-t border-gold pt-6">
          <h2 className="type-display text-display-sm">Your Design</h2>
          <p className="mt-2 max-w-[52ch] text-body text-chalk">{description}.</p>
          {unusual && (
            <p className="mt-2 max-w-[52ch] text-body-sm text-ash">
              Tailor’s note: a double-breasted front is traditionally cut with a peak lapel. We
              will make either.
            </p>
          )}
          <p className="mt-4 text-body-sm text-ash">
            Two-piece, cut to your pattern, from{" "}
            <span className="tabular text-body-lg text-chalk">{formatPrice(price)}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/book?service=measurement&cut=${encodeURIComponent(description)}`}
              className={button.primary}
            >
              Book a Measurement
            </Link>
            <Link href="/collection" className={button.secondary}>
              Shop Ready-to-Wear
            </Link>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            Suit updated: {description}.
          </p>
        </div>
      </div>
    </div>
  );
}
