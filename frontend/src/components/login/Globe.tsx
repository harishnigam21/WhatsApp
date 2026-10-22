"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type GlobeProps = {
  size?: number | string;
  color?: string;
  rotationSpeed?: number;
};

function Tube({
  curve,
  radius = 0.045,
  color = "#aae266",
}: {
  curve: THREE.Curve<THREE.Vector3>;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh>
      <tubeGeometry args={[curve, 96, radius, 10, true]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function GlobeModel({
  color = "#111111",
  rotationSpeed = 0.35,
}: Omit<GlobeProps, "size">) {
  const spin = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (spin.current) {
      // Rotate around the globe's OWN pole axis.
      spin.current.rotation.z += delta * rotationSpeed;
    }
  });
  const radius = 1.55;

  // Latitude rings.
  const latitudeCurves: THREE.Curve<THREE.Vector3>[] = [];
  const latitudeAngles = [-60, -35, 0, 35, 60];

  for (const degrees of latitudeAngles) {
    const lat = THREE.MathUtils.degToRad(degrees);
    const r = radius * Math.cos(lat);
    const z = radius * Math.sin(lat);

    const points = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);
    });

    latitudeCurves.push(
      new THREE.CatmullRomCurve3(points, true, "catmullrom", 0),
    );
  }

  // Longitude / meridian rings.
  const longitudeCurves: THREE.Curve<THREE.Vector3>[] = [];
  const longitudeAngles = [0, 30, 60, 90, 120, 150];

  for (const degrees of longitudeAngles) {
    const lon = THREE.MathUtils.degToRad(degrees);

    const points = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;

      return new THREE.Vector3(
        radius * Math.cos(a) * Math.cos(lon),
        radius * Math.cos(a) * Math.sin(lon),
        radius * Math.sin(a),
      );
    });

    longitudeCurves.push(
      new THREE.CatmullRomCurve3(points, true, "catmullrom", 0),
    );
  }

  return (
    /*
      This group NEVER rotates.

      It establishes the 25° axial tilt.
    */
    <group
      rotation={[THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(20), 0]}
    >
      {/*
        This group rotates around the Z axis.

        The Z axis passes directly through:
        North Pole → center → South Pole.
      */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#aae25f" />
      </mesh>
      <group ref={spin}>
        {/* Equator */}
        <Tube curve={latitudeCurves[2]} radius={0.02} color={color} />

        {/* Other latitude rings */}
        {latitudeCurves
          .filter((_, index) => index !== 2)
          .map((curve, index) => (
            <Tube
              key={`lat-${index}`}
              curve={curve}
              radius={0.02}
              color={color}
            />
          ))}

        {/* Longitude rings */}
        {longitudeCurves.map((curve, index) => (
          <Tube
            key={`lon-${index}`}
            curve={curve}
            radius={0.02}
            color={color}
          />
        ))}
      </group>
    </group>
  );
}

function Scene({ color, rotationSpeed }: Omit<GlobeProps, "size">) {
  return (
    <>
      <ambientLight intensity={1.5} />

      <directionalLight position={[4, 5, 6]} intensity={3} />

      <directionalLight
        position={[-4, 1, -5]}
        intensity={1.5}
        color="#9bbcff"
      />

      <GlobeModel color={color} rotationSpeed={rotationSpeed} />
    </>
  );
}

export default function Globe3D({
  size = 100,
  color = "black",
  rotationSpeed = 0.35,
}: GlobeProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        maxWidth: "100%",
        aspectRatio: "1 / 1",
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 4.8],
          fov: 38,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Scene color={color} rotationSpeed={rotationSpeed} />
      </Canvas>
    </div>
  );
}
