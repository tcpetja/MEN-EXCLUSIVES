import { BOOKING_WINDOW_DAYS, getService, isOpenDay } from "@/lib/booking";
import { listSlots } from "@/lib/booking-store";
import { dateFromISO } from "@/lib/format";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const service = getService(url.searchParams.get("service"));

  if (!service) return Response.json({ error: "Choose a service first." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateFromISO(date).getTime()))
    return Response.json({ error: "Choose a valid date." }, { status: 400 });

  const day = dateFromISO(date);
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysAhead = Math.round((day.getTime() - start) / 86_400_000);
  // a day of slack either side, because the visitor's "today" may differ from the server's
  const bookable = isOpenDay(day) && daysAhead >= 0 && daysAhead <= BOOKING_WINDOW_DAYS + 1;

  return Response.json(
    { date, slots: bookable ? listSlots(date, service.minutes) : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
