import Image from "next/image";
import Link from "next/link";
import { HeroShowcase } from "@/components/hero/HeroShowcase";
import { ClothSwatch } from "@/components/suit/ClothSwatch";
import { CLOTHS } from "@/components/suit/config";
import { button } from "@/components/ui/button";
import { SERVICES } from "@/lib/booking";
import { formatPrice } from "@/lib/format";
import { LINES, PRODUCT_IMAGE_SIZE, productImage } from "@/lib/products";
import { SITE } from "@/lib/site";

const LINE_COVERS: Record<string, string> = {
  executive: "executive-midnight",
  "black-tie": "tuxedo-shawl",
  "double-breasted": "double-breasted-camel",
  wedding: "wedding-ivory-linen",
};

export default function Home() {
  return (
    <>
      <HeroShowcase />

      <section aria-labelledby="cloth-heading" className="mx-auto max-w-[1440px] px-gutter py-24 md:py-32">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
          <h2 id="cloth-heading" className="type-display text-display-lg">
            Start With the Cloth
          </h2>
          <p className="max-w-[58ch] text-body-lg text-ash">
            Four cloths, each in four shades. Choose one, then set the lapel and the buttons and watch
            the suit change as you decide.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {CLOTHS.map((cloth) => (
            <li key={cloth.id}>
              <Link href={`/bespoke?cloth=${cloth.id}`} className="group block">
                <ClothSwatch
                  cloth={cloth.id}
                  color={cloth.shades[0].color}
                  pattern={cloth.shades[0].pattern}
                  pinked
                  className="aspect-[4/3] w-full transition-[filter] duration-150 ease-press group-hover:brightness-125"
                />
                <h3 className="type-display mt-4 text-display-sm text-chalk group-hover:text-gold-hi">
                  {cloth.name}
                </h3>
                <p className="mt-1 text-body-sm text-ash">
                  <span className="tabular">{cloth.weight}</span>, from{" "}
                  <span className="tabular">{formatPrice(cloth.fromPrice)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/bespoke" className={`${button.secondary} mt-12`}>
          Open the Customizer
        </Link>
      </section>

      <section aria-labelledby="lines-heading" className="border-t border-line">
        <div className="mx-auto max-w-[1440px] px-gutter py-24 md:py-32">
          <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
            <h2 id="lines-heading" className="type-display text-display-lg">
              Ready to Wear, Ready to Alter
            </h2>
            <p className="max-w-[58ch] text-body-lg text-ash">
              Four lines cut on the house block, in 21 sizes. Buy one today and we will take in a
              waist or shorten a sleeve before it leaves.
            </p>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {LINES.map((line) => (
              <li key={line.id}>
                <Link href={`/collection?line=${line.id}`} className="group block">
                  <div className="overflow-hidden bg-basalt">
                    <Image
                      src={productImage(LINE_COVERS[line.id])}
                      alt=""
                      {...PRODUCT_IMAGE_SIZE}
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      loading="lazy"
                      className="h-auto w-full transition-transform duration-[420ms] ease-cut group-hover:scale-[1.03]"
                    />
                  </div>
                  <h3 className="type-display mt-4 text-display-sm text-chalk group-hover:text-gold-hi">
                    {line.name}
                  </h3>
                  <p className="mt-1 max-w-[34ch] text-body-sm text-ash">{line.note}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="fitting-heading" className="border-t border-line bg-basalt">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-gutter py-24 md:grid-cols-[1fr_1.2fr] md:py-32">
          <div>
            <h2 id="fitting-heading" className="type-display text-display-lg">
              Fittings by Appointment
            </h2>
            <p className="mt-6 max-w-[44ch] text-body-lg text-ash">
              Every suit ends at the atelier. Choose what you need and pick a time; the cutter who
              measures you is the one who makes your pattern.
            </p>
            <p className="tabular mt-6 text-body-sm text-ash">
              {SITE.atelier.street}. {SITE.atelier.hours}.
            </p>
          </div>
          <ul>
            {SERVICES.map((service) => (
              <li key={service.id}>
                <div className="stitch-baste" aria-hidden="true" />
                <Link
                  href={`/book?service=${service.id}`}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 py-7"
                >
                  <h3 className="type-display text-display-md text-chalk group-hover:text-gold-hi">
                    {service.name}
                  </h3>
                  <p className="tabular type-label text-gold">{service.minutes}&nbsp;min</p>
                  <p className="col-span-2 max-w-[52ch] text-body text-ash">{service.note}</p>
                </Link>
              </li>
            ))}
            <li aria-hidden="true" className="stitch-baste" />
          </ul>
        </div>
      </section>
    </>
  );
}
