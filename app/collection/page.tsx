import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/catalog/Catalog";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Ready-to-Wear Collection",
  description:
    "Executive two-piece suits, black tie tuxedos, double-breasted suits and the wedding collection. Ready to wear in 21 sizes, altered before they leave.",
};

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-gutter pt-14 pb-24 md:pt-20">
      <div className="grid gap-6 pb-12 md:grid-cols-[1fr_1.2fr] md:items-end">
        <h1 className="type-display text-display-lg">The Collection</h1>
        <p className="max-w-[58ch] text-body-lg text-ash">
          12 suits across 4 lines, cut on the house block and ready to wear in 21 sizes. Every one
          can be altered at the atelier before it leaves.
        </p>
      </div>
      {/* The full grid is the static fallback; filters apply once the URL is known. */}
      <Suspense fallback={<ProductGrid products={PRODUCTS} />}>
        <Catalog />
      </Suspense>
    </div>
  );
}
