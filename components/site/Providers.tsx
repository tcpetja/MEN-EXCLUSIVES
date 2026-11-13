"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Every Framer Motion animation honours the visitor's reduced-motion setting. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
