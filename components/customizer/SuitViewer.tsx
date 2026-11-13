"use client";

import { useEffect, useRef, useState } from "react";
import { invalidate, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import type { SuitConfig } from "@/components/suit/config";
import { SuitCanvas, SuitScene, WebGLBoundary, webglAvailable } from "@/components/suit/Stage";
import { STUDIO, STUDIO_CHEST, cloneStage, mixStage, type StageState } from "@/components/suit/lighting";

const ANGLES = [
  { id: "front", name: "Front", yaw: 0 },
  { id: "quarter", name: "Three-Quarter", yaw: -0.5 },
  { id: "side", name: "Side", yaw: -Math.PI / 2 },
  { id: "back", name: "Back", yaw: Math.PI },
] as const;

/** Eases the suit toward the requested angle and framing. */
function Turntable({
  stateRef,
  yawTarget,
  detail,
  instant,
}: {
  stateRef: React.RefObject<StageState>;
  yawTarget: React.RefObject<number>;
  detail: boolean;
  instant: boolean;
}) {
  const zoom = useRef(detail ? 1 : 0);
  useEffect(() => invalidate(), [detail]);
  useFrame((_, dt) => {
    const s = stateRef.current;
    const k = instant ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 9);
    const yaw = s.yaw + (yawTarget.current - s.yaw) * k;
    const z = zoom.current + ((detail ? 1 : 0) - zoom.current) * k;
    const moving = Math.abs(yawTarget.current - yaw) > 0.0008 || Math.abs((detail ? 1 : 0) - z) > 0.002;
    zoom.current = moving ? z : detail ? 1 : 0;
    mixStage(STUDIO, STUDIO_CHEST, zoom.current, s);
    s.yaw = moving ? yaw : yawTarget.current;
    if (moving) invalidate();
  }, -2);
  return null;
}

/**
 * The live suit. Drag to turn it; the angle buttons do the same from the
 * keyboard. `fallback` shows if WebGL is unavailable.
 */
export default function SuitViewer({
  config,
  description,
  fallback,
}: {
  config: SuitConfig;
  /** Text alternative for the picture, e.g. "Obsidian Italian Wool, peak lapel…". */
  description: string;
  fallback: React.ReactNode;
}) {
  const stateRef = useRef<StageState>(cloneStage(STUDIO));
  const yawTarget = useRef(STUDIO.yaw);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const [angle, setAngle] = useState<string | null>(null);
  const [detail, setDetail] = useState(false);
  const [canRender, setCanRender] = useState<boolean | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // WebGL can only be probed in the browser, after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanRender(webglAvailable());
  }, []);

  const turnTo = (id: string, yaw: number) => {
    // take the short way round
    const current = yawTarget.current;
    yawTarget.current = yaw + Math.PI * 2 * Math.round((current - yaw) / (Math.PI * 2));
    setAngle(id);
    invalidate();
  };

  if (canRender === false) return <>{fallback}</>;

  return (
    <div className="relative h-full w-full">
      <div
        role="img"
        aria-label={`Your suit: ${description}. Drag to turn it, or use the angle buttons.`}
        className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, yaw: yawTarget.current };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          yawTarget.current = drag.current.yaw + (e.clientX - drag.current.x) * 0.011;
          if (angle !== null) setAngle(null);
          invalidate();
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {canRender && (
          <WebGLBoundary fallback={fallback}>
            <SuitCanvas>
              <Turntable stateRef={stateRef} yawTarget={yawTarget} detail={detail} instant={Boolean(reduceMotion)} />
              <SuitScene config={config} stateRef={stateRef} stand={false} />
            </SuitCanvas>
          </WebGLBoundary>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-x-1 gap-y-0 bg-linear-to-t from-obsidian to-transparent px-3 pt-8 pb-2">
        <div role="group" aria-label="View angle" className="flex">
          {ANGLES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => turnTo(a.id, a.yaw)}
              aria-pressed={angle === a.id}
              className="type-label h-11 px-3 text-ash transition-colors duration-150 ease-press hover:text-gold-hi aria-pressed:text-gold-hi aria-pressed:underline aria-pressed:decoration-gold aria-pressed:underline-offset-8"
            >
              {a.name}
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="mx-1 hidden h-4 w-px bg-line-strong sm:block" />
        <button
          type="button"
          onClick={() => setDetail((d) => !d)}
          aria-pressed={detail}
          className="type-label h-11 px-3 text-ash transition-colors duration-150 ease-press hover:text-gold-hi aria-pressed:text-gold-hi aria-pressed:underline aria-pressed:decoration-gold aria-pressed:underline-offset-8"
        >
          Close-Up
        </button>
      </div>
    </div>
  );
}
