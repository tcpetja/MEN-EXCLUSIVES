import type { ButtonsId, LapelId } from "@/components/suit/config";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinejoin: "miter" as const,
  strokeLinecap: "square" as const,
};

/** A cutter's sketch of one lapel: the roll line, the lapel edge and the collar. */
export function LapelDiagram({ lapel }: { lapel: LapelId }) {
  return (
    <svg width="56" height="64" viewBox="0 0 56 64" aria-hidden="true" focusable="false">
      {/* roll line from the neck to the button */}
      <path d="M40 4 12 60" {...stroke} strokeOpacity="0.45" strokeDasharray="3 3" />
      {lapel === "notch" && <path d="M40 4 46 12 38 17 50 23 12 60" {...stroke} />}
      {lapel === "peak" && <path d="M40 4 46 12 38 19 54 11 46 28 12 60" {...stroke} />}
      {lapel === "shawl" && <path d="M40 4C52 12 52 26 40 38 30 48 20 54 12 60" {...stroke} />}
    </svg>
  );
}

const BUTTON_DOTS: Record<ButtonsId, [number, number][]> = {
  one: [[28, 36]],
  two: [
    [28, 32],
    [28, 44],
  ],
  three: [
    [28, 24],
    [28, 35],
    [28, 46],
  ],
  double: [
    [17, 22],
    [39, 22],
    [20, 34],
    [36, 34],
    [20, 46],
    [36, 46],
  ],
};

/** The jacket front with its buttons, drawn flat. */
export function ButtonDiagram({ buttons }: { buttons: ButtonsId }) {
  const double = buttons === "double";
  return (
    <svg width="56" height="64" viewBox="0 0 56 64" aria-hidden="true" focusable="false">
      <path d="M10 6v54h36V6" {...stroke} strokeOpacity="0.45" />
      {/* front edge: centred, or wrapped across for a double-breasted front */}
      <path d={double ? "M28 6 14 26v34" : "M28 6v40l6 14"} {...stroke} strokeOpacity="0.45" />
      {BUTTON_DOTS[buttons].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.6" fill="currentColor" />
      ))}
    </svg>
  );
}
