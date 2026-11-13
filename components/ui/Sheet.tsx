"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A native modal <dialog>. The browser traps focus, makes the page inert,
 * closes on Esc and returns focus to the trigger. `variant` picks the
 * drawer ("sheet") or centred ("modal") look from globals.css.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  variant = "sheet",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  variant?: "sheet" | "modal";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // Esc is handled natively; the click handler only catches the backdrop.
    <dialog
      ref={ref}
      className={variant}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
