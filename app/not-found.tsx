import Link from "next/link";
import { button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[52rem] flex-col items-start gap-6 px-gutter py-32">
      <h1 className="type-display text-display-lg">This Page Has Been Cut</h1>
      <p className="max-w-[52ch] text-body-lg text-ash">
        The address is wrong or the suit has left the collection. Start again from the collection,
        or design your own.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/collection" className={button.primary}>
          Browse the Collection
        </Link>
        <Link href="/bespoke" className={button.secondary}>
          Design Your Suit
        </Link>
      </div>
    </div>
  );
}
