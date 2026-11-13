"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet } from "@/components/ui/Sheet";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { button, iconButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getProduct, productImage } from "@/lib/products";
import { cart, cartCount, cartSubtotal, useCart, type CartLine } from "./store";

function Line({ line }: { line: CartLine }) {
  const product = getProduct(line.slug);
  if (!product) return null;
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-4 border-b border-line py-5"
    >
      <Image
        src={productImage(product.slug)}
        alt=""
        width={80}
        height={100}
        className="h-[100px] w-20 shrink-0 bg-graphite object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/collection/${product.slug}`}
          onClick={cart.close}
          className="line-clamp-2 text-body-sm font-medium text-chalk hover:text-gold-hi"
        >
          {product.name}
        </Link>
        <p className="text-body-sm text-ash">
          Size <span className="tabular">{line.size}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center border border-line-strong rounded-control">
            <button
              type="button"
              className={iconButton}
              onClick={() => cart.setQty(line.key, line.qty - 1)}
              disabled={line.qty <= 1}
              aria-label={`Decrease quantity of ${product.name}, size ${line.size}`}
            >
              <MinusIcon />
            </button>
            <span className="tabular w-7 text-center text-body-sm" aria-label={`Quantity ${line.qty}`}>
              {line.qty}
            </span>
            <button
              type="button"
              className={iconButton}
              onClick={() => cart.setQty(line.key, line.qty + 1)}
              disabled={line.qty >= cart.maxQty}
              aria-label={`Increase quantity of ${product.name}, size ${line.size}`}
            >
              <PlusIcon />
            </button>
          </div>
          <p className="tabular text-body-sm text-chalk">{formatPrice(product.price * line.qty)}</p>
        </div>
        <button
          type="button"
          onClick={() => cart.remove(line.key)}
          className="link -mb-2 flex h-11 items-center self-start text-body-sm"
          aria-label={`Remove ${product.name}, size ${line.size}`}
        >
          Remove
        </button>
      </div>
    </motion.li>
  );
}

export function CartDrawer() {
  const { lines, open, removed, announcement } = useCart();
  const count = cartCount(lines);
  const removedName = removed ? getProduct(removed.slug)?.name : null;

  return (
    <Sheet open={open} onClose={cart.close} labelledBy="bag-title">
      <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
        <header className="flex items-center justify-between border-b border-line py-3 pr-3 pl-6">
          <h2 id="bag-title" className="type-display text-display-sm">
            Your Bag
            {count > 0 && <span className="tabular ml-2 font-sans text-body-sm text-ash">({count})</span>}
          </h2>
          <button type="button" className={iconButton} onClick={cart.close} aria-label="Close bag">
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6">
          {removedName && (
            <div className="mt-4 flex items-center justify-between gap-3 border border-line bg-graphite py-1 pr-1 pl-4">
              <p className="min-w-0 truncate text-body-sm text-ash">Removed {removedName}.</p>
              <button type="button" onClick={cart.undoRemove} className={`${button.quiet} h-11 text-gold`}>
                Undo
              </button>
            </div>
          )}
          {lines.length === 0 ? (
            <div className="flex flex-col items-start gap-5 py-12">
              <p className="text-body text-ash">Your bag is empty. Every suit in the collection is ready to wear, in 21 sizes.</p>
              <Link href="/collection" onClick={cart.close} className={button.secondary}>
                Browse the Collection
              </Link>
            </div>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <Line key={line.key} line={line} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="border-t border-line bg-basalt px-6 py-5">
            <div className="flex items-baseline justify-between">
              <p className="type-label text-ash">Subtotal</p>
              <p className="tabular text-body-lg text-chalk">{formatPrice(cartSubtotal(lines))}</p>
            </div>
            <p className="mt-1 text-body-sm text-ash">Trousers are hemmed to your length at no charge.</p>
            <Link href="/checkout" onClick={cart.close} className={`${button.primary} mt-4 w-full`}>
              Go to Checkout
            </Link>
          </footer>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>
    </Sheet>
  );
}
