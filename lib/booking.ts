export type ServiceId = "measurement" | "fitting" | "alterations";

export interface Service {
  id: ServiceId;
  name: string;
  minutes: number;
  note: string;
}

export const SERVICES: Service[] = [
  {
    id: "measurement",
    name: "First Measurement",
    minutes: 60,
    note: "For a new bespoke suit. We measure you, study how you stand and choose the cloth together.",
  },
  {
    id: "fitting",
    name: "Fitting",
    minutes: 45,
    note: "Try your suit while it is still basted. Every change is marked in chalk before it is sewn.",
  },
  {
    id: "alterations",
    name: "Alterations",
    minutes: 30,
    note: "Sleeves, waist, seat or hem adjusted on a suit you already own, ours or another maker’s.",
  },
];

export function getService(id: string | null | undefined) {
  return SERVICES.find((s) => s.id === id);
}

/** The atelier opens Monday to Saturday and takes bookings up to 60 days ahead. */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 18;
export const BOOKING_WINDOW_DAYS = 60;

export function isOpenDay(date: Date) {
  return date.getUTCDay() !== 0;
}

/** Start times for a service, every 30 minutes, ending by closing time. */
export function slotTimes(minutes: number) {
  const times: string[] = [];
  for (let t = OPEN_HOUR * 60; t + minutes <= CLOSE_HOUR * 60; t += 30) {
    times.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return times;
}

export interface Slot {
  time: string;
  available: boolean;
}

export interface AppointmentRequest {
  service: ServiceId;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export type FieldErrors = Partial<Record<"name" | "email" | "phone" | "notes", string>>;

export function validateDetails(input: Pick<AppointmentRequest, "name" | "email" | "phone" | "notes">) {
  const errors: FieldErrors = {};
  if (input.name.trim().length < 2) errors.name = "Enter your full name so we know who to expect.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim()))
    errors.email = "Enter an email address like name@example.com.";
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15)
    errors.phone = "Enter a phone number with 7 to 15 digits, including the area code.";
  if (input.notes.length > 600) errors.notes = "Shorten your note to 600 characters or fewer.";
  return errors;
}
