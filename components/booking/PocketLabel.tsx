import { formatLongDate, formatTime } from "@/lib/format";
import { SITE } from "@/lib/site";

/**
 * The confirmation, set as the label a tailor sews inside the breast pocket:
 * the house, who it was cut for, when, and its number in the order book.
 */
export function PocketLabel({
  name,
  service,
  date,
  time,
  reference,
}: {
  name: string;
  service: string;
  date: string;
  time: string;
  reference: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[30rem] border border-gold p-1.5">
      <div className="border border-gold/50 px-6 py-9 text-center">
        <p translate="no" className="type-display text-display-sm text-gold">
          {SITE.name}
        </p>
        <p className="mt-6 font-display text-body-lg text-ash italic">Reserved expressly for</p>
        <p className="type-display mt-1 text-display-md wrap-break-word text-chalk">{name}</p>
        <div className="stitch-seam mx-auto my-6 w-24" aria-hidden="true" />
        <dl className="grid gap-1 text-body-sm">
          <div>
            <dt className="sr-only">Appointment</dt>
            <dd className="text-chalk">{service}</dd>
          </div>
          <div>
            <dt className="sr-only">Date and time</dt>
            <dd className="tabular text-chalk">
              {formatLongDate(date)} at {formatTime(time)}
            </dd>
          </div>
          <div className="mt-3">
            <dt className="type-label inline text-ash">Reference </dt>
            <dd className="tabular type-label inline text-gold" translate="no">
              {reference}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
