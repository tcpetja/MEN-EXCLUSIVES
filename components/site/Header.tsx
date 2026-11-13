"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { BagIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { iconButton } from "@/components/ui/button";
import { cart, cartCount, useCart } from "@/components/cart/store";
import { NAV, SITE } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const { lines } = useCart();
  const count = cartCount(lines);
  const [menuOpen, setMenuOpen] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-obsidian/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-header max-w-[1440px] items-center justify-between gap-4 px-gutter">
        <Link
          href="/"
          translate="no"
          aria-label={`${SITE.name}, home`}
          className="type-display -ml-1 px-1 text-[1.625rem] leading-none text-chalk hover:text-gold-hi"
        >
          {SITE.name}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className="type-label relative flex h-11 items-center px-4 text-[0.875rem] text-chalk hover:text-gold-hi aria-[current=page]:text-gold-hi aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-4 aria-[current=page]:after:bottom-1.5 aria-[current=page]:after:h-px aria-[current=page]:after:bg-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cart.open}
            className={`${iconButton} relative`}
            aria-label={count === 0 ? "Open bag, empty" : `Open bag, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <BagIcon />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="tabular absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[0.6875rem] leading-none font-semibold text-obsidian"
              >
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`${iconButton} md:hidden`}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} labelledBy="menu-title">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line py-3 pr-3 pl-6">
            <h2 id="menu-title" className="type-display text-display-sm">
              Menu
            </h2>
            <button type="button" className={iconButton} onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Main" className="px-6 py-4">
            <ul>
              {NAV.map((item) => (
                <li key={item.href} className="border-b border-line">
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    className="type-display flex min-h-16 items-center text-[2rem] text-chalk hover:text-gold-hi aria-[current=page]:text-gold-hi"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Sheet>
    </header>
  );
}
