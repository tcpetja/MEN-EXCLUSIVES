import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioView } from "./StudioView";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/** Internal: renders one suit on a bare stage. `npm run render:stills` photographs it. */
export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioView />
    </Suspense>
  );
}
