import type { Metadata } from "next";
import { CheckoutSummary } from "@/components/cart/CheckoutSummary";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[52rem] px-gutter pt-14 pb-24 md:pt-20">
      <h1 className="type-display text-display-lg">Checkout</h1>
      <CheckoutSummary />
    </div>
  );
}
