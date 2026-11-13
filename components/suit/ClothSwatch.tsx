"use client";

import type { ClothId, ClothPattern } from "./config";
import { swatchDataURL } from "./weaves";

/**
 * A flat sample of a cloth, drawn from the same weave the 3D suit wears.
 * Shows the plain colour until the weave is drawn in the browser.
 */
export function ClothSwatch({
  cloth,
  color,
  pattern = "plain",
  pinked = false,
  className = "",
}: {
  cloth: ClothId;
  color: string;
  pattern?: ClothPattern;
  pinked?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      ref={(el) => {
        // a soft light across the sample, so dark cloths still show their surface
        if (el)
          el.style.backgroundImage = `linear-gradient(125deg, rgb(255 255 255 / 0.16), transparent 60%), url(${swatchDataURL(cloth, color, pattern, 128)})`;
      }}
      className={`block bg-size-[100%_100%,96px_96px] ${pinked ? "pinked" : ""} ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}
