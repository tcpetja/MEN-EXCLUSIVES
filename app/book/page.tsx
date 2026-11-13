import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a Fitting",
  description:
    "Book a first measurement, a fitting or alterations at the atelier. Choose a date and a time in four short steps.",
};

export default function BookPage() {
  return (
    <div className="mx-auto max-w-[56rem] px-gutter pt-14 pb-24 md:pt-20">
      <h1 className="type-display text-display-lg">Book a Fitting</h1>
      <p className="mt-4 max-w-[56ch] text-body-lg text-ash">
        Four short steps: what you need, when you can come, how to reach you, and a last look before
        you confirm.
      </p>
      <Suspense fallback={<p className="mt-10 text-body text-ash">Loading the booking steps…</p>}>
        <BookingFlow />
      </Suspense>
    </div>
  );
}
