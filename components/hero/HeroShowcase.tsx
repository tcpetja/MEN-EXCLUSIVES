"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { WebGLBoundary, webglAvailable } from "@/components/suit/Stage";
import { button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const CHAPTERS = [
  {
    id: "flagship",
    rail: "The Flagship",
    title: "Cut for One Man at a Time",
    body: "Bespoke suits made by hand from a pattern drawn for you alone. This is the house flagship: obsidian wool, peak lapels, brushed gold.",
  },
  {
    id: "cloth",
    rail: "The Cloth",
    title: "The Cloth",
    body: "Obsidian worsted from Biella, 280 g. A twill fine enough to vanish at arm’s length, and to show itself only when light rakes across it.",
  },
  {
    id: "cut",
    rail: "The Cut",
    title: "The Cut",
    body: "A lightly padded shoulder, a suppressed waist, a sleeve pitched the way your arm hangs. Drawn on paper first, then in chalk on the cloth.",
  },
  {
    id: "finish",
    rail: "The Finish",
    title: "The Finish",
    body: "Lapels rolled by hand, edges pick-stitched, buttons in brushed gold. Then it is pressed, and it is yours.",
  },
] as const;

const LAST = CHAPTERS.length - 1;

function Chapter({
  index,
  progress,
  onFocusWithin,
}: {
  index: number;
  progress: MotionValue<number>;
  onFocusWithin: (index: number) => void;
}) {
  const c = index / LAST;
  const fade = 0.07;
  const hold = 0.1;
  // the first chapter starts visible; the last one stays
  const opacity = useTransform(
    progress,
    [c - hold - fade, c - hold, c + hold, c + hold + fade],
    [index === 0 ? 1 : 0, 1, 1, index === LAST ? 1 : 0],
  );
  const y = useTransform(
    progress,
    [c - hold - fade, c - hold, c + hold, c + hold + fade],
    [index === 0 ? 0 : 28, 0, 0, index === LAST ? 0 : -28],
  );
  const pointerEvents = useTransform(opacity, (v) => (v > 0.6 ? "auto" : "none"));
  const chapter = CHAPTERS[index];
  const Heading = index === 0 ? "h1" : "h2";

  return (
    <motion.div
      style={{ opacity, y, pointerEvents }}
      onFocusCapture={() => onFocusWithin(index)}
      className="absolute inset-x-gutter bottom-[max(2.5rem,env(safe-area-inset-bottom))] max-w-[34rem] md:top-1/2 md:right-auto md:bottom-auto md:-translate-y-1/2 motion-reduce:pointer-events-auto! motion-reduce:static motion-reduce:translate-none motion-reduce:py-10 motion-reduce:opacity-100! motion-reduce:[transform:none]!"
    >
      <Heading
        className={`type-display text-chalk ${index === 0 ? "text-display-xl" : "text-display-lg"}`}
      >
        {chapter.title}
      </Heading>
      <p className="mt-5 max-w-[30rem] text-body-lg text-ash md:mt-7">{chapter.body}</p>
      {index === 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/bespoke" className={button.primary}>
            Design Your Suit
          </Link>
          <Link href="/book" className={button.secondary}>
            Book a Measurement
          </Link>
        </div>
      )}
      {index === LAST && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/bespoke" className={button.primary}>
            Design Your Suit
          </Link>
          <Link href="/collection" className={button.secondary}>
            Shop Ready-to-Wear
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export function HeroShowcase() {
  const track = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [canRender, setCanRender] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  // Under reduced motion nothing follows the scroll: CSS unpins the hero and
  // shows every chapter, and the scene holds its finished pose.
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.0004 });

  useEffect(() => {
    // WebGL can only be probed in the browser, after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanRender(webglAvailable());
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.round(v * LAST);
    setActive((prev) => (prev === next ? prev : next));
  });

  const goTo = (index: number) => {
    const el = track.current;
    if (!el) return;
    const range = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY + (index / LAST) * range;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  };

  // a keyboard user tabbing into a hidden chapter brings that chapter into view
  const onFocusWithin = (index: number) => {
    if (reduceMotion) return;
    if (Math.abs(scrollYProgress.get() - index / LAST) > 0.08) goTo(index);
  };

  const cueOpacity = useTransform(progress, [0, 0.06], [1, 0]);
  const poster = (
    <Image
      src="/suits/hero.webp"
      alt=""
      width={1200}
      height={1200}
      priority
      sizes="100vh"
      className="h-full w-auto max-w-none"
    />
  );

  return (
    <section
      ref={track}
      aria-label="The flagship bespoke suit"
      className="relative h-[420svh] motion-reduce:h-auto"
    >
      <div className="sticky top-header h-[calc(100svh-var(--spacing-header))] overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible">
        {/* stage */}
        <div
          className="absolute inset-0 overflow-hidden motion-reduce:relative motion-reduce:h-[72svh]"
          role="img"
          aria-label="The flagship suit on a tailor’s form: obsidian wool with peak lapels, a gold silk tie and brushed gold buttons. It turns and the light changes as you scroll."
        >
          <div className="absolute inset-0 bg-[radial-gradient(48%_52%_at_50%_30%,rgb(200_167_102/0.12),transparent_72%)] md:bg-[radial-gradient(34%_58%_at_70%_44%,rgb(200_167_102/0.12),transparent_72%)] motion-reduce:bg-[radial-gradient(40%_56%_at_50%_44%,rgb(200_167_102/0.12),transparent_72%)]" />
          <div
            className={`absolute inset-0 flex -translate-y-[14%] justify-center transition-opacity duration-700 ease-press md:translate-x-[20%] md:translate-y-0 motion-reduce:translate-none ${ready ? "opacity-0" : "opacity-100"}`}
          >
            {poster}
          </div>
          {canRender && (
            <WebGLBoundary fallback={null}>
              <div className={`absolute inset-0 transition-opacity duration-700 ease-press ${ready ? "opacity-100" : "opacity-0"}`}>
                <HeroScene progress={progress} still={reduceMotion} onReady={() => setReady(true)} />
              </div>
            </WebGLBoundary>
          )}
          {/* scrim so text stays legible over the suit on narrow screens */}
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-obsidian via-obsidian/85 to-transparent md:hidden motion-reduce:hidden" />
        </div>

        {/* chapters */}
        <div className="relative mx-auto h-full max-w-[1440px] motion-reduce:h-auto motion-reduce:px-gutter motion-reduce:pb-16">
          {CHAPTERS.map((chapter, i) => (
            <Chapter key={chapter.id} index={i} progress={progress} onFocusWithin={onFocusWithin} />
          ))}
        </div>

        {/* chapter rail */}
        <nav
          aria-label="Suit chapters"
          className="absolute top-1/2 right-gutter hidden -translate-y-1/2 lg:block motion-reduce:hidden"
        >
          <ol className="flex flex-col items-end">
            {CHAPTERS.map((chapter, i) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i ? "step" : undefined}
                  className="group type-label flex h-11 items-center gap-3 text-ash hover:text-gold-hi aria-[current=step]:text-chalk"
                >
                  {chapter.rail}
                  <span
                    aria-hidden="true"
                    className="h-px w-8 origin-right scale-x-50 bg-line-strong transition-transform duration-300 ease-cut group-aria-[current=step]:scale-x-100 group-aria-[current=step]:bg-gold"
                  />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <motion.p
          aria-hidden="true"
          style={{ opacity: cueOpacity }}
          className="type-label absolute right-gutter bottom-8 hidden text-ash md:block motion-reduce:hidden"
        >
          Scroll to turn the suit
        </motion.p>
      </div>
    </section>
  );
}
