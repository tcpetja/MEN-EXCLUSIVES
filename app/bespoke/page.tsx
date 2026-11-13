import type { Metadata } from "next";
import { Suspense } from "react";
import { Customizer } from "@/components/customizer/Customizer";

export const metadata: Metadata = {
  title: "Design Your Suit",
  description:
    "Choose Italian wool, cashmere, linen or velvet, set the lapel and the buttons, and see your bespoke suit in 3D before it is cut.",
};

export default function BespokePage() {
  return (
    <Suspense
      fallback={
        <div className="px-gutter py-14">
          <h1 className="type-display text-display-lg">Design Your Suit</h1>
          <p className="mt-4 text-body-lg text-ash">Loading the customizer…</p>
        </div>
      }
    >
      <Customizer />
    </Suspense>
  );
}
