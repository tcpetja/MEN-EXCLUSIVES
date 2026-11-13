"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import type * as THREE from "three";
import { FLAGSHIP } from "@/components/suit/config";
import { SuitCanvas, SuitScene } from "@/components/suit/Stage";
import { HERO_CHAPTERS, cloneStage, heroStage, type StageState } from "@/components/suit/lighting";

/**
 * Shifts the picture inside the frame without moving the camera: the suit
 * sits right of centre on wide screens and above centre on tall ones, leaving
 * room for the text. HeroShowcase positions the poster image the same way.
 */
function frame(camera: THREE.PerspectiveCamera, zoom: number, w: number, h: number, dx: number, dy: number) {
  camera.zoom = zoom;
  camera.setViewOffset(w, h, dx, dy, w, h);
}

function Framing({ centred }: { centred: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const aspect = size.width / size.height;
    const wide = aspect > 1.15;
    // with reduced motion the text sits below the stage, so the suit stays centred
    const dx = wide && !centred ? -0.2 * size.width : 0;
    const dy = wide || centred ? 0 : 0.14 * size.height;
    // on a narrow screen, step back until the shoulders fit the width
    frame(camera, wide ? 1 : Math.min(1, aspect / 0.62), size.width, size.height, dx, dy);
    invalidate();
    return () => {
      frame(camera, 1, size.width, size.height, 0, 0);
      camera.clearViewOffset();
    };
  }, [camera, size, invalidate, centred]);
  return null;
}

function Driver({
  progress,
  still,
  stateRef,
  onFirstFrame,
}: {
  progress: MotionValue<number>;
  still: boolean;
  stateRef: React.RefObject<StageState>;
  onFirstFrame: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const frames = useRef(0);
  useMotionValueEvent(progress, "change", () => {
    if (!still) invalidate();
  });
  useEffect(() => invalidate(), [still, invalidate]);
  useFrame(() => {
    heroStage(still ? 1 : progress.get(), stateRef.current);
    frames.current += 1;
    // the environment is baked on the first frame; ask for a second one, then reveal
    if (frames.current < 3) invalidate();
    if (frames.current === 3) onFirstFrame();
  }, -2);
  return null;
}

export default function HeroScene({
  progress,
  still,
  onReady,
}: {
  /** Scroll position through the hero, 0..1. */
  progress: MotionValue<number>;
  /** Hold the finished pose instead of following the scroll (reduced motion). */
  still: boolean;
  onReady: () => void;
}) {
  const stateRef = useRef<StageState>(cloneStage(HERO_CHAPTERS[0]));
  return (
    <SuitCanvas>
      <Framing centred={still} />
      <Driver progress={progress} still={still} stateRef={stateRef} onFirstFrame={onReady} />
      <SuitScene config={FLAGSHIP} stateRef={stateRef} />
    </SuitCanvas>
  );
}
