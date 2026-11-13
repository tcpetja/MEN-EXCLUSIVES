import Link from "next/link";
import { NAV, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-basalt pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-gutter py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p translate="no" className="type-display text-display-md text-chalk">
            {SITE.name}
          </p>
          <p className="mt-4 max-w-[38ch] text-body-sm text-ash">
            Suits cut by hand, a ready-to-wear collection and fittings by appointment.
          </p>
        </div>
        <div>
          <h2 className="type-label text-gold">{SITE.atelier.name}</h2>
          <address className="mt-4 text-body-sm text-ash not-italic">
            <p>{SITE.atelier.street}</p>
            <p className="tabular">{SITE.atelier.hours}</p>
            <p>
              <a href={`mailto:${SITE.atelier.email}`} className="link break-all">
                {SITE.atelier.email}
              </a>
            </p>
          </address>
        </div>
        <nav aria-label="Footer">
          <h2 className="type-label text-gold">Explore</h2>
          <ul className="mt-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex h-11 items-center text-body-sm text-chalk hover:text-gold-hi">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1440px] px-gutter py-5 text-body-sm text-ash">
          © <span translate="no">{SITE.name}</span>. All suits are made to be altered.
        </p>
      </div>
    </footer>
  );
}
