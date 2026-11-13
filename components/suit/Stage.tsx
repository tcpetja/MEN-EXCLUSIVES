"use client";

import { Component, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { SuitConfig } from "./config";
import { SuitModel } from "./SuitModel";
import { LIGHT_COLORS, type StageState } from "./lighting";

/**
 * Lights, reflected environment and camera, all driven from one state object.
 * The parent mutates `stateRef.current` and invalidates; nothing re-renders.
 */
export function Rig({
  stateRef,
  suitRef,
}: {
  stateRef: RefObject<StageState>;
  suitRef: RefObject<THREE.Group | null>;
}) {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const kicker = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);

  useFrame(({ camera, scene }) => {
    const s = stateRef.current;
    if (key.current) {
      key.current.intensity = s.key;
      key.current.position.set(s.keyPos[0], s.keyPos[1], s.keyPos[2]);
    }
    if (rim.current) rim.current.intensity = s.rim;
    if (kicker.current) kicker.current.intensity = s.kicker;
    if (fill.current) fill.current.intensity = s.fill;
    scene.environmentIntensity = s.env;
    camera.position.set(s.camera[0], s.camera[1], s.camera[2]);
    camera.lookAt(s.target[0], s.target[1], s.target[2]);
    if (suitRef.current) suitRef.current.rotation.y = s.yaw;
  }, -1);

  return (
    <>
      <hemisphereLight ref={fill} args={["#cfd8e6", "#1a1410", 0.5]} />
      <directionalLight
        ref={key}
        color={LIGHT_COLORS.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.006}
        shadow-radius={5}
      >
        <orthographicCamera attach="shadow-camera" args={[-0.6, 0.6, 0.95, -0.25, 0.5, 8]} />
      </directionalLight>
      <directionalLight ref={rim} color={LIGHT_COLORS.rim} position={[-2.2, 1.5, -2.4]} />
      <directionalLight ref={kicker} color={LIGHT_COLORS.kicker} position={[2.4, 0.7, -1.9]} />
      <Environment resolution={256} frames={1}>
        {/* a soft overhead bank, a warm panel at the customer's right, a cool strip at the left */}
        <Lightformer form="rect" intensity={2.2} color="#fff4e0" position={[0, 4, 1]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#ffe8cc" position={[4.5, 1, 1.5]} rotation-y={-Math.PI / 2.4} scale={[2.2, 5, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#a9c8ff" position={[-4.5, 1.2, -1]} rotation-y={Math.PI / 2.2} scale={[1.2, 5, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#c8a766" position={[0, 0.5, 5]} scale={[5, 0.5, 1]} />
      </Environment>
    </>
  );
}

/** Suit plus rig. `stateRef` is owned and animated by the parent. */
export function SuitScene({
  config,
  stateRef,
  stand = true,
  children,
}: {
  config: SuitConfig;
  stateRef: RefObject<StageState>;
  stand?: boolean;
  children?: ReactNode;
}) {
  const suit = useRef<THREE.Group>(null);
  return (
    <>
      <Rig stateRef={stateRef} suitRef={suit} />
      <group ref={suit}>
        <SuitModel config={config} stand={stand} />
      </group>
      {children}
    </>
  );
}

export function SuitCanvas({
  children,
  className,
  frameloop = "demand",
  onReady,
}: {
  children: ReactNode;
  className?: string;
  frameloop?: "demand" | "always";
  onReady?: () => void;
}) {
  return (
    <Canvas
      className={className}
      shadows="percentage"
      frameloop={frameloop}
      dpr={[1, 1.75]}
      camera={{ fov: 26, near: 0.1, far: 30, position: [0, 0.44, 2.95] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
      aria-hidden="true"
    >
      {children}
    </Canvas>
  );
}

export function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Shows `fallback` if the renderer cannot start or the scene throws. */
export class WebGLBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
