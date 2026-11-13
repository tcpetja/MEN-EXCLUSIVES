"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { CloseIcon } from "@/components/ui/Icons";
import { iconButton } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { CHESTS, LENGTHS, SIZE_CHART } from "@/lib/products";

const HOW_TO = [
  ["Chest", "Round the fullest part, under the arms, with the tape level and your arms at your sides."],
  ["Waist", "Round the natural waist, just above the navel. Breathe out and keep a finger behind the tape."],
  ["Shoulder", "Across the back, from one shoulder point to the other, over the base of the neck."],
  ["Sleeve", "From the shoulder point down the outside of a relaxed arm to the wrist bone."],
  ["Jacket length", "From the base of the collar at the back, straight down to where the jacket should end."],
] as const;

export function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const show = (inches: number) => formatNumber(unit === "in" ? inches : Math.round(inches * 2.54));

  return (
    <Sheet open={open} onClose={onClose} labelledBy="size-guide-title" variant="modal">
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex items-center justify-between border-b border-line py-3 pr-3 pl-6">
          <h2 id="size-guide-title" className="type-display text-display-sm">
            Size Guide
          </h2>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close size guide">
            <CloseIcon />
          </button>
        </header>

        <div className="overflow-y-auto overscroll-contain px-6 py-6">
          <p className="max-w-[60ch] text-body-sm text-ash">
            Suits are sized by chest, then by length. The table shows the body each size is cut to
            fit. Between sizes, take the larger; we can take a jacket in more easily than let it out.
          </p>

          <fieldset className="mt-5 flex items-center gap-2">
            <legend className="type-label float-left mr-3 flex h-11 items-center text-ash">Units</legend>
            {(["in", "cm"] as const).map((u) => (
              <label
                key={u}
                className="type-label flex h-11 min-w-16 cursor-pointer items-center justify-center rounded-control border border-line-strong px-3 text-chalk hover:border-gold-hi has-checked:border-gold has-checked:bg-graphite has-checked:text-gold-hi has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-hi"
              >
                <input
                  type="radio"
                  name="size-unit"
                  value={u}
                  checked={unit === u}
                  onChange={() => setUnit(u)}
                  className="sr-only"
                />
                {u === "in" ? "Inches" : "Centimetres"}
              </label>
            ))}
          </fieldset>

          {/* focusable so the table can be scrolled sideways from the keyboard */}
          <div className="mt-5 overflow-x-auto" tabIndex={0} role="region" aria-labelledby="size-table-caption">
            <table className="tabular w-full min-w-[30rem] border-collapse text-left text-body-sm">
              <caption id="size-table-caption" className="sr-only">
                Body measurements for each chest size, regular length, in {unit === "in" ? "inches" : "centimetres"}
              </caption>
              <thead>
                <tr className="border-b border-line-strong text-ash">
                  {["Size", "Chest", "Waist", "Shoulder", "Sleeve", "Jacket Length"].map((h) => (
                    <th key={h} scope="col" className="type-label py-3 pr-4 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHESTS.map((chest) => {
                  const row = SIZE_CHART[chest];
                  return (
                    <tr key={chest} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 font-medium text-gold">
                        {chest}
                      </th>
                      <td className="py-3 pr-4">{show(chest)}</td>
                      <td className="py-3 pr-4">{show(row.waist)}</td>
                      <td className="py-3 pr-4">{show(row.shoulder)}</td>
                      <td className="py-3 pr-4">{show(row.sleeve)}</td>
                      <td className="py-3 pr-4">{show(row.length)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="type-display mt-8 text-display-sm">Length</h3>
          <dl className="mt-3 grid gap-x-8 gap-y-2 text-body-sm sm:grid-cols-3">
            {LENGTHS.map((l) => (
              <div key={l.id}>
                <dt className="font-medium text-chalk">{l.name}</dt>
                <dd className="tabular text-ash">{l.height}</dd>
              </div>
            ))}
          </dl>
          <p className="tabular mt-3 text-body-sm text-ash">
            Short is cut {show(1.25)}&nbsp;{unit} shorter in the body and {show(0.75)}&nbsp;{unit} shorter
            in the sleeve; Long is the same amount longer.
          </p>

          <h3 className="type-display mt-8 text-display-sm">How to Measure</h3>
          <dl className="mt-3 grid gap-3 text-body-sm">
            {HOW_TO.map(([term, text]) => (
              <div key={term} className="grid gap-x-6 sm:grid-cols-[8rem_1fr]">
                <dt className="font-medium text-chalk">{term}</dt>
                <dd className="text-ash">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Sheet>
  );
}
