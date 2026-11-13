"use client";

import Image from "next/image";
import Link from "next/link";
import { button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getProduct, productImage } from "@/lib/products";
import { cartSubtotal, useCart } from "./store";

export function CheckoutSummary() {
  const { lines } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-start gap-5">
        <p className="text-body-lg text-ash">Your bag is empty, so there is nothing to check out yet.</p>
        <Link href="/collection" className={button.primary}>
          Browse the Collection
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-10 border-t border-line">
        {lines.map((line) => {
          const product = getProduct(line.slug);
          if (!product) return null;
          return (
            <li key={line.key} className="flex items-center gap-5 border-b border-line py-5">
              <Image
                src={productImage(product.slug)}
                alt=""
                width={64}
                height={80}
                className="h-20 w-16 shrink-0 bg-basalt object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-chalk">{product.name}</p>
                <p className="tabular text-body-sm text-ash">
                  Size {line.size}, quantity {line.qty}
                </p>
              </div>
              <p className="tabular text-body text-chalk">{formatPrice(product.price * line.qty)}</p>
            </li>
          );
        })}
      </ul>
      <div className="flex items-baseline justify-between py-6">
        <p className="type-label text-ash">Subtotal</p>
        <p className="tabular type-display text-display-sm">{formatPrice(cartSubtotal(lines))}</p>
      </div>

      <div className="border border-line bg-basalt p-6">
        <h2 className="type-display text-display-sm">Payment Is Not Connected Yet</h2>
        <p className="mt-2 max-w-[60ch] text-body-sm text-ash">
          This build stops here: no payment provider is wired in, so no order is placed and no card
          is asked for. Your bag is kept on this device. To have these suits fitted in person,
          book a time at the atelier.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/book?service=fitting" className={button.primary}>
            Book a Fitting
          </Link>
          <Link href="/collection" className={button.secondary}>
            Keep Shopping
          </Link>
        </div>
      </div>
    </>
  );
}
