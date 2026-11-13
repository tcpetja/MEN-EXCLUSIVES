"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFrame } from "@react-three/fiber";
import { FLAGSHIP, type SuitConfig } from "@/components/suit/config";
import { SuitCanvas, SuitScene } from "@/components/suit/Stage";
import { STUDIO, STUDIO_CHEST, cloneStage, type StageState } from "@/components/suit/lighting";

function ReadyAfter({ frames, onReady }: { frames: number; onReady: () => void }) {
  const count = useRef(0);
  useFrame(() => {
    count.current += 1;
    if (count.current === frames) onReady();
  });
  return null;
}

export function StudioView() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);

  const pick = <K extends keyof SuitConfig>(key: K): SuitConfig[K] => {
    const raw = params.get(key);
    if (raw === null) return FLAGSHIP[key];
    const base = FLAGSHIP[key];
    if (typeof base === "boolean") return (raw === "1") as SuitConfig[K];
    if (key === "color" || key === "neckwearColor") return `#${raw}` as SuitConfig[K];
    return raw as SuitConfig[K];
  };

  const config: SuitConfig = {
    cloth: pick("cloth"),
    color: pick("color"),
    pattern: pick("pattern"),
    lapel: pick("lapel"),
    buttons: pick("buttons"),
    buttonFinish: pick("buttonFinish"),
    satinLapel: pick("satinLapel"),
    jetted: pick("jetted"),
    neckwear: pick("neckwear"),
    neckwearColor: pick("neckwearColor"),
    pocketSquare: pick("pocketSquare"),
  };

  const view = params.get("view") === "chest" ? STUDIO_CHEST : STUDIO;
  const state = cloneStage(view);
  const yaw = params.get("yaw");
  if (yaw !== null) state.yaw = (Number(yaw) * Math.PI) / 180;
  const dist = params.get("dist");
  if (dist !== null) state.camera[2] = Number(dist);
  const camY = params.get("camY");
  if (camY !== null) {
    state.camera[1] = Number(camY);
    state.target[1] = Number(camY) - 0.04;
  }
  const stateRef = useRef<StageState>(state);
  stateRef.current = state;

  return (
    <div
      id="studio"
      data-ready={ready}
      className="fixed inset-0 z-50 bg-obsidian"
      style={{
        backgroundImage:
          params.get("glow") === "0"
            ? undefined
            : "radial-gradient(60% 55% at 50% 42%, rgb(200 167 102 / 0.11), transparent 70%)",
      }}
    >
      <SuitCanvas frameloop="always">
        <SuitScene config={config} stateRef={stateRef} stand={params.get("stand") !== "0"} />
        <ReadyAfter frames={6} onReady={() => setReady(true)} />
      </SuitCanvas>
    </div>
  );
}
