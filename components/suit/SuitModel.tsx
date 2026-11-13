"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { SuitConfig } from "./config";
import { CLOTH_SURFACE, getClothTextures } from "./fabrics";
import { cutSuit, disposeCut, getStaticParts, type ButtonPlacement } from "./geometry";

const WHITE = new THREE.Color("#ffffff");

/** Frees a material when it is replaced or the suit unmounts. */
function useDispose(resource: { dispose(): void }) {
  useEffect(() => () => resource.dispose(), [resource]);
}

function Buttons({
  placements,
  geometry,
  material,
}: {
  placements: ButtonPlacement[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}) {
  return placements.map((b, i) => (
    <mesh
      key={i}
      geometry={geometry}
      material={material}
      position={b.position}
      quaternion={b.quaternion}
      scale={[b.radius, 1, b.radius]}
      castShadow
    />
  ));
}

/**
 * The suit on its form. Lapel, button and trim choices re-cut the geometry;
 * cloth and colour swap the material. Rotate or light it from the parent.
 */
export function SuitModel({ config, stand = true }: { config: SuitConfig; stand?: boolean }) {
  const parts = getStaticParts();
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  const cut = useMemo(
    () =>
      cutSuit({
        lapel: config.lapel,
        buttons: config.buttons,
        jetted: config.jetted,
        neckwear: config.neckwear,
      }),
    [config.lapel, config.buttons, config.jetted, config.neckwear],
  );
  useEffect(() => () => disposeCut(cut), [cut]);

  const cloth = useMemo(() => {
    const surface = CLOTH_SURFACE[config.cloth];
    const textures = getClothTextures(
      config.cloth,
      config.color,
      config.pattern,
      Math.min(8, maxAnisotropy),
    );
    return new THREE.MeshPhysicalMaterial({
      map: textures.map,
      bumpMap: textures.bumpMap,
      bumpScale: surface.bumpScale,
      roughness: surface.roughness,
      metalness: 0,
      sheen: surface.sheen,
      sheenRoughness: surface.sheenRoughness,
      sheenColor: new THREE.Color(config.color).lerp(WHITE, surface.sheenLift),
      side: THREE.DoubleSide,
    });
  }, [config.cloth, config.color, config.pattern, maxAnisotropy]);

  const satin = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(config.color).multiplyScalar(0.55),
        roughness: 0.3,
        metalness: 0,
        sheen: 0.4,
        sheenRoughness: 0.3,
        sheenColor: new THREE.Color("#8a8f9c"),
        side: THREE.DoubleSide,
      }),
    [config.color],
  );

  const shirt = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e9e4d8", roughness: 0.82, side: THREE.DoubleSide }),
    [],
  );

  const silk = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: config.neckwearColor,
        roughness: 0.46,
        sheen: 0.8,
        sheenRoughness: 0.35,
        sheenColor: new THREE.Color(config.neckwearColor).lerp(WHITE, 0.5),
        side: THREE.DoubleSide,
      }),
    [config.neckwearColor],
  );

  const buttonMaterial = useMemo(
    () =>
      config.buttonFinish === "gold"
        ? new THREE.MeshStandardMaterial({ color: "#d2b06c", metalness: 1, roughness: 0.46 })
        : new THREE.MeshPhysicalMaterial({
            color: "#1d1814",
            roughness: 0.38,
            clearcoat: 0.6,
            clearcoatRoughness: 0.3,
          }),
    [config.buttonFinish],
  );

  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b8975a", metalness: 1, roughness: 0.4 }),
    [],
  );
  const neck = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#17181b", roughness: 0.9 }),
    [],
  );
  const dark = useMemo(() => new THREE.MeshBasicMaterial({ color: "#030303" }), []);

  useDispose(cloth);
  useDispose(satin);
  useDispose(shirt);
  useDispose(silk);
  useDispose(buttonMaterial);
  useDispose(brass);
  useDispose(neck);
  useDispose(dark);

  const facing = config.satinLapel ? satin : cloth;
  const frontButtonMaterial = config.satinLapel ? satin : buttonMaterial;

  return (
    <group>
      {/* jacket */}
      <mesh geometry={cut.shell} material={cloth} castShadow receiveShadow />
      <mesh geometry={parts.sleeves} material={cloth} castShadow receiveShadow />
      <mesh geometry={cut.lapels} material={facing} castShadow receiveShadow />
      <mesh geometry={cut.collar} material={cloth} castShadow receiveShadow />
      <mesh geometry={cut.pockets} material={config.satinLapel ? satin : cloth} castShadow receiveShadow />
      {config.pocketSquare && <mesh geometry={cut.pocketSquare} material={shirt} castShadow />}
      <Buttons placements={cut.frontButtons} geometry={parts.button} material={frontButtonMaterial} />
      <Buttons placements={parts.cuffButtons} geometry={parts.button} material={frontButtonMaterial} />

      {/* shirt, neckwear, trousers */}
      <mesh geometry={parts.shirt} material={shirt} receiveShadow />
      <mesh geometry={parts.shirtCollar} material={shirt} castShadow receiveShadow />
      <mesh geometry={parts.shirtCuffs} material={shirt} />
      <mesh geometry={parts.cuffEnds} material={dark} />
      {cut.neckwear && <mesh geometry={cut.neckwear} material={silk} castShadow receiveShadow />}
      <mesh geometry={parts.trousers} material={cloth} receiveShadow />
      <mesh geometry={parts.formBase} material={dark} />

      {/* the form */}
      <mesh geometry={parts.neck} material={neck} />
      <mesh geometry={parts.neckCap} material={brass} castShadow />
      {stand && <mesh geometry={parts.stand} material={brass} />}
    </group>
  );
}
