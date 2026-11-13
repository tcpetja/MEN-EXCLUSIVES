"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { cart } from "@/components/cart/store";
import { AlertIcon, RulerIcon } from "@/components/ui/Icons";
import { button } from "@/components/ui/button";
import { CHESTS, LENGTHS, type Chest, type LengthId, type Product } from "@/lib/products";
import { SizeGuide } from "./SizeGuide";

const chipBase =
  "tabular relative flex h-12 cursor-pointer items-center justify-center rounded-control border border-line-strong text-body-sm text-chalk transition-[color,border-color,background-color] duration-150 ease-press hover:border-gold-hi has-checked:border-gold has-checked:bg-graphite has-checked:text-gold-hi has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-hi has-disabled:cursor-not-allowed has-disabled:border-line has-disabled:text-ash has-disabled:line-through has-disabled:hover:border-line";

export function PurchasePanel({ product }: { product: Product }) {
  const params = useSearchParams();
  const errorId = useId();
  const firstChest = useRef<HTMLInputElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // length chosen before a chest size is; once both are set the URL holds them
  const [pendingLength, setPendingLength] = useState<LengthId>("R");

  // the chosen size lives in the URL (?size=40R) so a link can carry it
  const match = /^(\d{2})([SRL])$/.exec(params.get("size") ?? "");
  const chest = match && CHESTS.includes(Number(match[1]) as Chest) ? (Number(match[1]) as Chest) : null;
  const shownLength: LengthId = chest ? (match![2] as LengthId) : pendingLength;
  const size = chest ? `${chest}${shownLength}` : null;
  const soldOut = (c: Chest, l: LengthId) => product.soldOut.includes(`${c}${l}`);
  const unavailable = chest !== null && soldOut(chest, shownLength);

  const choose = (c: Chest | null, l: LengthId) => {
    setPendingLength(l);
    setError(null);
    if (!c) return;
    const next = new URLSearchParams(window.location.search);
    next.set("size", `${c}${l}`);
    window.history.replaceState(null, "", `?${next.toString()}`);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!size) {
      setError("Choose a chest size to add this suit to your bag.");
      firstChest.current?.focus();
      return;
    }
    if (unavailable) {
      setError(`${size} is sold out. Choose another size, or book a measurement and we will make it.`);
      return;
    }
    cart.add(product, size);
  };

  return (
    <form onSubmit={add} noValidate className="mt-8">
      <fieldset aria-describedby={error ? errorId : undefined}>
        <div className="flex items-end justify-between gap-4">
          <legend className="type-label float-left text-chalk">
            Chest{chest ? <span className="tabular text-ash">: {chest} in</span> : null}
          </legend>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="link -my-3 flex h-11 items-center gap-2 text-body-sm"
          >
            <RulerIcon width={18} height={18} />
            Size Guide
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4 xl:grid-cols-7">
          {CHESTS.map((c, i) => {
            const out = soldOut(c, shownLength);
            return (
              <label key={c} className={chipBase}>
                <input
                  ref={i === 0 ? firstChest : undefined}
                  type="radio"
                  name="chest"
                  value={c}
                  checked={chest === c}
                  disabled={out}
                  onChange={() => choose(c, shownLength)}
                  className="sr-only"
                />
                {c}
                {out && <span className="sr-only">, sold out</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="type-label text-chalk">Length</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {LENGTHS.map((l) => (
            <label key={l.id} className={`${chipBase} h-auto flex-col py-2.5`}>
              <input
                type="radio"
                name="length"
                value={l.id}
                checked={shownLength === l.id}
                onChange={() => choose(chest, l.id)}
                className="sr-only"
              />
              <span className="font-medium">{l.name}</span>
              <span className="mt-0.5 px-1 text-center text-[0.75rem] leading-tight text-ash">{l.height}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite">
        {error && (
          <p id={errorId} className="mt-4 flex items-start gap-2 text-body-sm text-ember">
            <AlertIcon className="mt-0.5 shrink-0" width={18} height={18} />
            {error}
          </p>
        )}
      </div>

      <button type="submit" className={`${button.primary} mt-6 w-full`}>
        {size ? `Add Size ${size} to Bag` : "Add to Bag"}
      </button>
      <p className="mt-3 text-body-sm text-ash">
        Not sure of your size?{" "}
        <Link href="/book?service=alterations" className="link">
          Book a fitting
        </Link>{" "}
        and we will alter it to you.
      </p>

      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </form>
  );
}
