"use client";

import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { iconButton } from "@/components/ui/button";
import { isOpenDay } from "@/lib/booking";
import { dateFromISO, formatLongDate, formatMonth, toISODate, weekdayNames } from "@/lib/format";

const DAY = 86_400_000;
const WEEKDAYS = weekdayNames();

function addDays(iso: string, days: number) {
  return toISODate(new Date(dateFromISO(iso).getTime() + days * DAY));
}

const monthOf = (iso: string) => iso.slice(0, 7);

/**
 * A month grid for choosing a day. Arrow keys move by day and week, Page Up
 * and Page Down by month, Home and End to the ends of the week. Closed and
 * out-of-range days can be reached but not chosen, and say why.
 */
export function Calendar({
  value,
  onChange,
  min,
  max,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  /** First and last bookable days, as ISO dates. `min` is today. */
  min: string;
  max: string;
}) {
  const [cursor, setCursor] = useState(value && value >= min && value <= max ? value : min);
  const grid = useRef<HTMLTableElement>(null);
  const month = monthOf(cursor);
  const first = dateFromISO(`${month}-01`);
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first

  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  const reason = (iso: string) => {
    if (iso < min) return "in the past";
    if (iso > max) return "not open for booking yet";
    if (!isOpenDay(dateFromISO(iso))) return "closed";
    return null;
  };

  const moveTo = (iso: string, focus = true) => {
    const next = iso < min ? min : iso > max ? max : iso;
    setCursor(next);
    if (focus) {
      // wait for the new month to render before moving focus into it
      requestAnimationFrame(() =>
        grid.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
      );
    }
  };

  const shiftMonth = (delta: number, focus: boolean) => {
    const d = dateFromISO(cursor);
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d.getUTCDate(), last));
    moveTo(toISODate(target), focus);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const weekday = (dateFromISO(cursor).getUTCDay() + 6) % 7;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => moveTo(addDays(cursor, -1)),
      ArrowRight: () => moveTo(addDays(cursor, 1)),
      ArrowUp: () => moveTo(addDays(cursor, -7)),
      ArrowDown: () => moveTo(addDays(cursor, 7)),
      Home: () => moveTo(addDays(cursor, -weekday)),
      End: () => moveTo(addDays(cursor, 6 - weekday)),
      PageUp: () => shiftMonth(-1, true),
      PageDown: () => shiftMonth(1, true),
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      move();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className={iconButton}
          onClick={() => shiftMonth(-1, false)}
          disabled={month <= monthOf(min)}
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>
        <p id="calendar-month" className="type-display text-display-sm" aria-live="polite">
          {formatMonth(first)}
        </p>
        <button
          type="button"
          className={iconButton}
          onClick={() => shiftMonth(1, false)}
          disabled={month >= monthOf(max)}
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <table ref={grid} aria-labelledby="calendar-month" className="mt-2 w-full table-fixed border-collapse" onKeyDown={onKeyDown}>
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d.long} scope="col" abbr={d.long} className="type-label h-9 text-center font-medium text-ash">
                {d.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((iso, d) => {
                if (!iso) return <td key={d} />;
                const why = reason(iso);
                const selected = iso === value;
                return (
                  <td key={d} className="p-0.5 text-center">
                    <button
                      type="button"
                      data-date={iso}
                      tabIndex={iso === cursor ? 0 : -1}
                      aria-pressed={selected}
                      aria-disabled={why ? true : undefined}
                      aria-current={iso === min ? "date" : undefined}
                      aria-label={`${formatLongDate(iso)}${why ? `, ${why}` : ""}`}
                      onClick={() => {
                        setCursor(iso);
                        if (!why) onChange(iso);
                      }}
                      className="tabular relative mx-auto flex aspect-square w-full max-w-12 min-h-11 items-center justify-center rounded-control border border-transparent text-body-sm text-chalk transition-[color,border-color,background-color] duration-150 ease-press hover:border-gold-hi aria-pressed:border-gold aria-pressed:bg-gold aria-pressed:font-semibold aria-pressed:text-obsidian aria-disabled:cursor-not-allowed aria-disabled:text-line-strong aria-disabled:line-through aria-disabled:hover:border-transparent"
                    >
                      {Number(iso.slice(8))}
                      {iso === min && (
                        <span aria-hidden="true" className="absolute bottom-1.5 size-1 rounded-full bg-current" />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
