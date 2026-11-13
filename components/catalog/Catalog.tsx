"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CLOTHS, type ClothId } from "@/components/suit/config";
import { CheckIcon } from "@/components/ui/Icons";
import { button } from "@/components/ui/button";
import { LINES, PRODUCTS, type LineId } from "@/lib/products";
import { ProductGrid } from "./ProductCard";

const SORTS = [
  { id: "featured", name: "Featured" },
  { id: "price-asc", name: "Price, Low to High" },
  { id: "price-desc", name: "Price, High to Low" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const chip =
  "type-label inline-flex h-11 items-center gap-2 rounded-control border border-line-strong px-4 text-chalk hover:border-gold-hi hover:text-gold-hi aria-[current=true]:border-gold aria-[current=true]:bg-graphite aria-[current=true]:text-gold-hi";

/**
 * The collection with its filters. Every filter is a link, so the URL always
 * describes what is on screen and can be shared, bookmarked or opened in a tab.
 */
export function Catalog() {
  const params = useSearchParams();
  const line = LINES.find((l) => l.id === params.get("line"))?.id ?? null;
  const cloths = (params.get("cloth") ?? "")
    .split(",")
    .filter((c): c is ClothId => CLOTHS.some((x) => x.id === c));
  const sort: SortId = SORTS.find((s) => s.id === params.get("sort"))?.id ?? "featured";

  const href = (patch: { line?: LineId | null; cloth?: ClothId[]; sort?: SortId }) => {
    const next = new URLSearchParams();
    const nextLine = patch.line === undefined ? line : patch.line;
    const nextCloths = patch.cloth ?? cloths;
    const nextSort = patch.sort ?? sort;
    if (nextLine) next.set("line", nextLine);
    if (nextCloths.length) next.set("cloth", nextCloths.join(","));
    if (nextSort !== "featured") next.set("sort", nextSort);
    const query = next.toString();
    return query ? `/collection?${query}` : "/collection";
  };

  const products = PRODUCTS.filter(
    (p) => (!line || p.line === line) && (cloths.length === 0 || cloths.includes(p.suit.cloth)),
  );
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);

  const filtered = Boolean(line) || cloths.length > 0;

  return (
    <>
      <div className="border-y border-line py-5">
        <nav aria-label="Filter by line">
          <ul className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 [scrollbar-width:none]">
            <li className="shrink-0">
              <Link href={href({ line: null })} scroll={false} replace aria-current={line === null ? "true" : undefined} className={chip}>
                All Suits
              </Link>
            </li>
            {LINES.map((l) => (
              <li key={l.id} className="shrink-0">
                <Link href={href({ line: l.id })} scroll={false} replace aria-current={line === l.id ? "true" : undefined} className={chip}>
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div role="group" aria-label="Filter by cloth" className="flex flex-wrap items-center gap-2">
            <span className="type-label mr-1 text-ash" aria-hidden="true">
              Cloth
            </span>
            {CLOTHS.map((c) => {
              const on = cloths.includes(c.id);
              return (
                <Link
                  key={c.id}
                  href={href({ cloth: on ? cloths.filter((x) => x !== c.id) : [...cloths, c.id] })}
                  scroll={false}
                  replace
                  aria-current={on ? "true" : undefined}
                  className={chip}
                >
                  {on && <CheckIcon width={16} height={16} />}
                  {c.name}
                </Link>
              );
            })}
          </div>

          <div role="group" aria-label="Sort" className="flex flex-wrap items-center gap-x-1">
            <span className="type-label mr-2 text-ash" aria-hidden="true">
              Sort
            </span>
            {SORTS.map((s) => (
              <Link
                key={s.id}
                href={href({ sort: s.id })}
                scroll={false}
                replace
                aria-current={sort === s.id ? "true" : undefined}
                className="type-label flex h-11 items-center px-2 text-ash hover:text-gold-hi aria-[current=true]:text-gold-hi aria-[current=true]:underline aria-[current=true]:decoration-gold aria-[current=true]:underline-offset-8"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="tabular py-6 text-body-sm text-ash" role="status" aria-live="polite">
        {products.length} {products.length === 1 ? "suit" : "suits"}
        {filtered ? " match your filters" : " in the collection"}
      </p>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="flex flex-col items-start gap-5 border-t border-line py-16">
          <h2 className="type-display text-display-md">No Suits Match Those Filters</h2>
          <p className="max-w-[52ch] text-body text-ash">
            We do not make that line in that cloth ready-to-wear. Clear the filters to see
            everything, or have it made for you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/collection" scroll={false} replace className={button.primary}>
              Clear Filters
            </Link>
            <Link href="/bespoke" className={button.secondary}>
              Design It Bespoke
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
