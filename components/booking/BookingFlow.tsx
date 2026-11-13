"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { AlertIcon, CheckIcon, Spinner } from "@/components/ui/Icons";
import { button } from "@/components/ui/button";
import {
  BOOKING_WINDOW_DAYS,
  SERVICES,
  getService,
  isOpenDay,
  validateDetails,
  type FieldErrors,
  type Slot,
} from "@/lib/booking";
import { dateFromISO, formatLongDate, formatTime, toISODate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Calendar } from "./Calendar";
import { PocketLabel } from "./PocketLabel";

const STEPS = ["Service", "Date & Time", "Your Details", "Review"] as const;

type Details = { name: string; email: string; phone: string; notes: string };
type SlotResult = Slot[] | "error";

const tile =
  "relative flex cursor-pointer rounded-control border border-line-strong hover:border-gold-hi has-checked:border-gold has-checked:bg-graphite has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-hi";

const field =
  "mt-2 block w-full rounded-control border border-line-strong bg-graphite px-4 text-body text-chalk placeholder:text-ash/70 hover:border-chalk focus-visible:border-gold-hi aria-invalid:border-ember";

/** Today's date where the visitor is, known only in the browser. */
function useToday() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const now = new Date();
      return toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
    },
    () => null,
  );
}

function setQuery(patch: Record<string, string | null>, push = false) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const url = `?${next.toString()}`;
  if (push) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

function without<T>(record: Record<string, T>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

function Inline({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-body-sm text-ember">
      <AlertIcon className="mt-0.5 shrink-0" width={18} height={18} />
      <span>{children}</span>
    </p>
  );
}

export function BookingFlow() {
  const params = useSearchParams();
  const today = useToday();
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const service = getService(params.get("service"));
  const cut = params.get("cut");
  const [details, setDetails] = useState<Details>(() => ({
    name: "",
    email: "",
    phone: "",
    notes: cut ? `Bespoke design: ${cut}.` : "",
  }));
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [slotResults, setSlotResults] = useState<Record<string, SlotResult>>({});
  const [submit, setSubmit] = useState<{ state: "idle" | "sending" } | { state: "failed"; message: string; conflict: boolean }>({ state: "idle" });
  const [confirmed, setConfirmed] = useState<{ reference: string; date: string; time: string; service: string; name: string } | null>(null);

  // Appointments open from tomorrow, so a time that has already passed is never offered.
  const addDays = (iso: string, days: number) => toISODate(new Date(dateFromISO(iso).getTime() + days * 86_400_000));
  const min = today ? addDays(today, 1) : null;
  const max = today ? addDays(today, BOOKING_WINDOW_DAYS) : null;
  const rawDate = params.get("date");
  const date =
    rawDate && min && max && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate >= min && rawDate <= max && isOpenDay(dateFromISO(rawDate))
      ? rawDate
      : null;
  const slotKey = service && date ? `${service.id}:${date}` : null;
  const slots = slotKey ? slotResults[slotKey] : undefined;
  const rawTime = params.get("time");
  const time = date && rawTime && /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : null;
  const timeTaken = Array.isArray(slots) && time !== null && !slots.some((s) => s.time === time && s.available);

  // A step can be opened only when the ones before it are complete.
  const detailsValid = Object.keys(validateDetails(details)).length === 0;
  const reachable = !service ? 1 : !date || !time || timeTaken ? 2 : !detailsValid ? 3 : 4;
  const step = Math.min(Math.max(1, Number(params.get("step")) || 1), reachable);

  // Load the times for the chosen day.
  useEffect(() => {
    if (!slotKey || slotResults[slotKey] !== undefined) return;
    const controller = new AbortController();
    const [serviceId, day] = slotKey.split(":");
    fetch(`/api/availability?service=${serviceId}&date=${day}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { slots: Slot[] }) => setSlotResults((r) => ({ ...r, [slotKey]: data.slots })))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setSlotResults((r) => ({ ...r, [slotKey]: "error" }));
      });
    return () => controller.abort();
  }, [slotKey, slotResults]);

  // Warn before leaving with details typed but not yet confirmed.
  useEffect(() => {
    if (!dirty || confirmed) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, confirmed]);

  // Move focus to the heading of the step that just opened.
  const lastStep = useRef(step);
  useEffect(() => {
    if (lastStep.current !== step || confirmed) heading.current?.focus();
    lastStep.current = step;
  }, [step, confirmed]);

  const goTo = (n: number) => {
    setStepError(null);
    setQuery({ step: String(n) }, true);
  };

  const next = () => {
    if (step === 1 && !service) return setStepError("Choose the appointment you need to continue.");
    if (step === 2 && !date) return setStepError("Choose a date to see the times we have open.");
    if (step === 2 && (!time || timeTaken)) return setStepError("Choose a time to continue.");
    if (step === 3) {
      const errors = validateDetails(details);
      setFieldErrors(errors);
      const first = (["name", "email", "phone", "notes"] as const).find((k) => errors[k]);
      if (first) {
        form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
    }
    goTo(step + 1);
  };

  const update = (key: keyof Details, value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setDirty(true);
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  const confirm = async () => {
    if (!service || !date || !time || submit.state === "sending") return;
    setSubmit({ state: "sending" });
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.id, date, time, ...details }),
      });
      const data: { reference?: string; error?: string; fieldErrors?: FieldErrors } = await res.json();
      if (res.status === 201 && data.reference) {
        setConfirmed({ reference: data.reference, date, time, service: service.name, name: details.name.trim() });
        setSubmit({ state: "idle" });
        return;
      }
      if (data.fieldErrors) {
        setFieldErrors(data.fieldErrors);
        setSubmit({ state: "idle" });
        goTo(3);
        return;
      }
      if (res.status === 409 && slotKey) {
        // the day's times are stale: fetch them again
        setSlotResults((r) => without(r, slotKey));
      }
      setSubmit({
        state: "failed",
        conflict: res.status === 409,
        message: data.error ?? "The appointment could not be confirmed. Try again in a moment.",
      });
    } catch {
      setSubmit({
        state: "failed",
        conflict: false,
        message: "We could not reach the atelier. Check your connection, then confirm again.",
      });
    }
  };

  const downloadInvite = () => {
    if (!confirmed) return;
    const minutes = SERVICES.find((s) => s.name === confirmed.service)?.minutes ?? 60;
    const start = `${confirmed.date.replaceAll("-", "")}T${confirmed.time.replace(":", "")}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Men Exclusives//Appointments//EN",
      "BEGIN:VEVENT",
      `UID:${confirmed.reference}@menexclusives`,
      `DTSTART:${start}`,
      `DURATION:PT${minutes}M`,
      `SUMMARY:${confirmed.service} at ${SITE.name}`,
      `LOCATION:${SITE.atelier.street.replaceAll(",", "\\,")}`,
      `DESCRIPTION:Reference ${confirmed.reference}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${confirmed.reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (confirmed) {
    return (
      <div className="mt-10">
        <h2 ref={heading} tabIndex={-1} className="type-display text-center text-display-md">
          Your Appointment Is Confirmed
        </h2>
        <p className="mx-auto mt-3 mb-10 max-w-[48ch] text-center text-body text-ash">
          Keep the reference below. You will need it to move or cancel your appointment.
        </p>
        <PocketLabel {...confirmed} />
        <p className="tabular mx-auto mt-8 max-w-[48ch] text-center text-body-sm text-ash">
          {SITE.atelier.name}, {SITE.atelier.street}. Times are local to the atelier.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={downloadInvite} className={button.primary}>
            Add to Calendar
          </button>
          <Link href="/collection" className={button.secondary}>
            Browse the Collection
          </Link>
        </div>
      </div>
    );
  }

  const describedBy = (key: keyof FieldErrors, hint?: string) =>
    [fieldErrors[key] ? `${key}-error` : null, hint ?? null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="mt-10">
      {/* progress: a finished seam behind you, basting stitches ahead */}
      <nav aria-label="Booking steps">
        <ol className="grid grid-cols-4">
          {STEPS.map((name, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li key={name} className="relative pt-4">
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 ${done || current ? "stitch-seam" : "stitch-baste"}`} />
                {done ? (
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    className="group flex min-h-11 w-full flex-col items-start text-left"
                  >
                    <span className="tabular type-label flex items-center gap-1.5 text-gold">
                      <CheckIcon width={14} height={14} strokeWidth={2} />
                      <span className="sr-only">Completed: </span>Step {n}
                    </span>
                    <span className="mt-0.5 hidden text-body-sm text-chalk underline decoration-line-strong underline-offset-4 group-hover:text-gold-hi sm:block">
                      {name}
                    </span>
                  </button>
                ) : (
                  <div aria-current={current ? "step" : undefined} className="flex min-h-11 flex-col">
                    <span className={`tabular type-label ${current ? "text-gold" : "text-ash"}`}>Step {n}</span>
                    <span className={`mt-0.5 hidden text-body-sm sm:block ${current ? "text-chalk" : "text-ash"}`}>{name}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* The new step mounts at once (so focus can move to it) and eases in. */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, ease: [0.2, 0.7, 0.1, 1] }}
        className="mt-10"
      >
          {step === 1 && (
            <fieldset>
              <legend>
                <h2 ref={heading} tabIndex={-1} className="type-display text-display-md">
                  What Do You Need?
                </h2>
              </legend>
              <div className="mt-6 grid gap-3">
                {SERVICES.map((s) => (
                  <label key={s.id} className={`${tile} items-start gap-4 p-5`}>
                    <input
                      type="radio"
                      name="service"
                      value={s.id}
                      checked={service?.id === s.id}
                      onChange={() => {
                        setStepError(null);
                        setQuery({ service: s.id, time: null });
                      }}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong peer-checked:border-gold peer-checked:[&>span]:scale-100"
                    >
                      <span className="size-2 scale-0 rounded-full bg-gold transition-transform duration-150 ease-press" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span className="type-display text-display-sm text-chalk">{s.name}</span>
                        <span className="tabular type-label text-gold">{s.minutes}&nbsp;min</span>
                      </span>
                      <span className="mt-1 block max-w-[56ch] text-body-sm text-ash">{s.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && service && (
            <div>
              <h2 ref={heading} tabIndex={-1} className="type-display text-display-md">
                Choose a Date &amp; Time
              </h2>
              <p className="tabular mt-2 text-body-sm text-ash">
                {service.name}, {service.minutes}&nbsp;min. {SITE.atelier.hours}. Times are local to the atelier.
              </p>
              <div className="mt-6 grid gap-10 md:grid-cols-2">
                <div>
                  {today && min && max ? (
                    <Calendar
                      value={date}
                      today={today}
                      min={min}
                      max={max}
                      onChange={(iso) => {
                        setStepError(null);
                        setQuery({ date: iso, time: null });
                      }}
                    />
                  ) : (
                    <p className="text-body-sm text-ash">Loading the calendar…</p>
                  )}
                </div>
                <div aria-live="polite" aria-busy={Boolean(date) && slots === undefined}>
                  {!date && <p className="text-body text-ash">Choose a date to see the times we have open.</p>}
                  {date && slots === undefined && (
                    <p className="flex items-center gap-2 text-body text-ash">
                      <Spinner /> Loading times…
                    </p>
                  )}
                  {date && slots === "error" && (
                    <div>
                      <Inline>Times for this day could not be loaded. Check your connection and try again.</Inline>
                      <button
                        type="button"
                        className={`${button.secondary} mt-4`}
                        onClick={() => slotKey && setSlotResults((r) => without(r, slotKey))}
                      >
                        Load Times Again
                      </button>
                    </div>
                  )}
                  {date && Array.isArray(slots) && (
                    <fieldset>
                      <legend className="type-display text-display-sm text-chalk">{formatLongDate(date)}</legend>
                      {slots.some((s) => s.available) ? (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {slots.map((s) => (
                            <label
                              key={s.time}
                              className={`${tile} tabular h-12 items-center justify-center text-body-sm text-chalk has-checked:text-gold-hi has-disabled:cursor-not-allowed has-disabled:border-line has-disabled:text-line-strong has-disabled:line-through has-disabled:hover:border-line`}
                            >
                              <input
                                type="radio"
                                name="time"
                                value={s.time}
                                checked={time === s.time}
                                disabled={!s.available}
                                onChange={() => {
                                  setStepError(null);
                                  setQuery({ time: s.time });
                                }}
                                className="sr-only"
                              />
                              {formatTime(s.time)}
                              {!s.available && <span className="sr-only">, taken</span>}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-body text-ash">Every time on this day is taken. Choose another date.</p>
                      )}
                    </fieldset>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <form
              ref={form}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <h2 ref={heading} tabIndex={-1} className="type-display text-display-md">
                Your Details
              </h2>
              <p className="mt-2 text-body-sm text-ash">We use these only to hold and confirm your appointment.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="type-label text-chalk">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={details.name}
                    onChange={(e) => update("name", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={describedBy("name")}
                    placeholder="Alex Morgan…"
                    className={`${field} h-12`}
                  />
                  {fieldErrors.name && <Inline id="name-error">{fieldErrors.name}</Inline>}
                </div>
                <div>
                  <label htmlFor="email" className="type-label text-chalk">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    autoCapitalize="none"
                    required
                    value={details.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={describedBy("email")}
                    placeholder="name@example.com…"
                    className={`${field} h-12`}
                  />
                  {fieldErrors.email && <Inline id="email-error">{fieldErrors.email}</Inline>}
                </div>
                <div>
                  <label htmlFor="phone" className="type-label text-chalk">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={details.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={describedBy("phone")}
                    placeholder="+1 555 010 0199…"
                    className={`${field} tabular h-12`}
                  />
                  {fieldErrors.phone && <Inline id="phone-error">{fieldErrors.phone}</Inline>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="type-label text-chalk">
                    Notes <span className="font-normal text-ash">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    autoComplete="off"
                    value={details.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.notes)}
                    aria-describedby={describedBy("notes", "notes-hint")}
                    placeholder="The occasion, a deadline, a suit you are bringing…"
                    className={`${field} py-3`}
                  />
                  <p id="notes-hint" className="tabular mt-2 text-body-sm text-ash">
                    {details.notes.length} of 600 characters
                  </p>
                  {fieldErrors.notes && <Inline id="notes-error">{fieldErrors.notes}</Inline>}
                </div>
              </div>
              {/* lets Enter submit the form; the visible button below does the same */}
              <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
                Review Appointment
              </button>
            </form>
          )}

          {step === 4 && service && date && time && (
            <div>
              <h2 ref={heading} tabIndex={-1} className="type-display text-display-md">
                Review Your Appointment
              </h2>
              <dl className="mt-6 border-t border-line">
                {[
                  { term: "Appointment", value: `${service.name}, ${service.minutes}\u00a0min`, to: 1 },
                  { term: "Date & time", value: `${formatLongDate(date)} at ${formatTime(time)}`, to: 2 },
                  { term: "Name", value: details.name, to: 3 },
                  { term: "Contact", value: `${details.email}, ${details.phone}`, to: 3 },
                  ...(details.notes.trim() ? [{ term: "Notes", value: details.notes, to: 3 }] : []),
                ].map((row) => (
                  <div key={row.term} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-line py-4 sm:grid-cols-[10rem_1fr_auto]">
                    <dt className="type-label col-span-2 text-ash sm:col-span-1 sm:pt-0.5">{row.term}</dt>
                    <dd className="tabular min-w-0 text-body wrap-break-word whitespace-pre-line text-chalk">{row.value}</dd>
                    <dd>
                      <button
                        type="button"
                        onClick={() => goTo(row.to)}
                        className="link -my-2.5 flex h-11 items-center text-body-sm"
                        aria-label={`Change ${row.term.toLowerCase()}`}
                      >
                        Change
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-body-sm text-ash">
                {SITE.atelier.name}, {SITE.atelier.street}.
              </p>
            </div>
          )}
      </motion.div>

      <div aria-live="polite">
        {stepError && <Inline>{stepError}</Inline>}
        {step === 4 && submit.state === "failed" && <Inline>{submit.message}</Inline>}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {step === 4 ? (
          submit.state === "failed" && submit.conflict ? (
            <button
              type="button"
              className={button.primary}
              onClick={() => {
                setSubmit({ state: "idle" });
                setQuery({ time: null, step: "2" }, true);
              }}
            >
              Choose Another Time
            </button>
          ) : (
            <button
              type="button"
              onClick={confirm}
              aria-disabled={submit.state === "sending"}
              className={`${button.primary} aria-disabled:cursor-progress aria-disabled:brightness-90`}
            >
              {submit.state === "sending" ? (
                <>
                  <Spinner /> Confirming…
                </>
              ) : (
                "Confirm Appointment"
              )}
            </button>
          )
        ) : (
          <button type="button" onClick={next} className={button.primary}>
            {step === 1 ? "Choose a Date" : step === 2 ? "Enter Your Details" : "Review Appointment"}
          </button>
        )}
        {step > 1 && (
          <button type="button" onClick={() => goTo(step - 1)} className={button.quiet}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
