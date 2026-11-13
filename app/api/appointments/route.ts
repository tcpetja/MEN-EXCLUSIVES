import { getService, isOpenDay, slotTimes, validateDetails, type AppointmentRequest } from "@/lib/booking";
import { book } from "@/lib/booking-store";
import { dateFromISO } from "@/lib/format";

export async function POST(request: Request) {
  let body: Partial<AppointmentRequest>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request could not be read. Reload the page and try again." }, { status: 400 });
  }

  const service = getService(body.service);
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  const details = {
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    notes: String(body.notes ?? ""),
  };

  const fieldErrors = validateDetails(details);
  if (Object.keys(fieldErrors).length > 0)
    return Response.json({ error: "Check your details and try again.", fieldErrors }, { status: 400 });

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && isOpenDay(dateFromISO(date));
  if (!service || !validDate || !slotTimes(service.minutes).includes(time))
    return Response.json({ error: "That appointment is not available. Choose a date and time again." }, { status: 400 });

  const result = book({ service: service.id, date, time, ...details });
  if ("conflict" in result)
    return Response.json({ error: "That time was just taken. Choose another time." }, { status: 409 });

  return Response.json({ reference: result.reference }, { status: 201 });
}
