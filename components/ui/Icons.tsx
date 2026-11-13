import type { SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const BagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h12l-1 10H5L4 7Z" />
    <path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
  </Icon>
);
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 5 10 10M15 5 5 15" />
  </Icon>
);
export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 7h14M3 13h14" />
  </Icon>
);
export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </Icon>
);
export const ChevronLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 4.5 6.5 10l5.5 5.5" />
  </Icon>
);
export const ChevronRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8 4.5 13.5 10 8 15.5" />
  </Icon>
);
export const MinusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 10h10" />
  </Icon>
);
export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 10h10M10 5v10" />
  </Icon>
);
export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <path d="M10 3 2.5 16h15L10 3Z" />
    <path d="M10 8v4M10 14.2v.3" />
  </Icon>
);
export const RulerIcon = (p: P) => (
  <Icon {...p}>
    <path d="M2.5 7h15v6h-15z" />
    <path d="M6 7v2.5M9 7v3.5M12 7v2.5M15 7v3.5" />
  </Icon>
);

/** A spinner for pending requests. Stops under reduced motion (the label carries the state). */
export const Spinner = (p: P) => (
  <Icon {...p} className={`motion-safe:animate-spin ${p.className ?? ""}`}>
    <path d="M10 3a7 7 0 1 1-7 7" strokeLinecap="round" />
  </Icon>
);
