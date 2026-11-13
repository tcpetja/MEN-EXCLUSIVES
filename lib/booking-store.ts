import "server-only";
import { slotTimes, type AppointmentRequest, type Slot } from "./booking";

/**
 * Appointment storage for this build: held in memory on the server.
 * It resets on restart and is not shared between server instances.
 * Replace `listSlots` and `book` with calls to your calendar or database.
 */
const store = globalThis as typeof globalThis & {
  __appointments?: Map<string, AppointmentRequest & { reference: string }>;
};
const appointments = (store.__appointments ??= new Map());

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Some slots are shown as already taken so the calendar behaves like a real one. */
function takenElsewhere(date: string, time: string) {
  return hash(`${date}T${time}`) < 0.3;
}

export function listSlots(date: string, minutes: number): Slot[] {
  return slotTimes(minutes).map((time) => ({
    time,
    available: !takenElsewhere(date, time) && !appointments.has(`${date}T${time}`),
  }));
}

export function book(request: AppointmentRequest): { reference: string } | { conflict: true } {
  const key = `${request.date}T${request.time}`;
  if (takenElsewhere(request.date, request.time) || appointments.has(key)) return { conflict: true };
  const reference = `ME-${request.date.replaceAll("-", "").slice(2)}-${Math.floor(hash(key + request.email) * 9000 + 1000)}`;
  appointments.set(key, { ...request, reference });
  return { reference };
}
