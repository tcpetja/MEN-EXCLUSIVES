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
function Framing() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const wide = size.width / size.height > 1.15;
    const dx = wide ? -0.2 * size.width : 0;
    const dy = wide ? 0 : 0.14 * size.height;
    camera.setViewOffset(size.width, size.height, dx, dy, size.width, size.height);
    invalidate();
    return () => camera.clearViewOffset();
  }, [camera, size, invalidate]);
  return null;
}

function Driver({
  progress,
  stateRef,
  onFirstFrame,
}: {
  progress: MotionValue<number>;
  stateRef: React.RefObject<StageState>;
  onFirstFrame: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const frames = useRef(0);
  useMotionValueEvent(progress, "change", () => invalidate());
  useFrame(() => {
    heroStage(progress.get(), stateRef.current);
    frames.current += 1;
    // the environment is baked on the first frame; ask for a second one, then reveal
    if (frames.current < 3) invalidate();
    if (frames.current === 3) onFirstFrame();
  }, -2);
  return null;
}

export default function HeroScene({
  progress,
  onReady,
}: {
  /** Scroll position through the hero, 0..1. */
  progress: MotionValue<number>;
  onReady: () => void;
}) {
  const stateRef = useRef<StageState>(cloneStage(HERO_CHAPTERS[0]));
  return (
    <SuitCanvas>
      <Framing />
      <Driver progress={progress} stateRef={stateRef} onFirstFrame={onReady} />
      <SuitScene config={FLAGSHIP} stateRef={stateRef} />
    </SuitCanvas>
  );
}
