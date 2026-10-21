"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRouter } from "next/navigation";
import type { Station } from "@/lib/stations";

function Stations({ stations }: { stations: Station[] }) {
  const router = useRouter();
  return (
    <>
      {stations.map((station, index) => {
        const angle = (index / stations.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 1.7;
        const z = Math.sin(angle) * 1.7;
        return (
          <mesh
            key={station.href}
            position={[x, 0.15, z]}
            onClick={() => router.push(station.href)}
          >
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial color={index % 2 === 0 ? "#1C7C74" : "#E08A2C"} />
          </mesh>
        );
      })}
    </>
  );
}

export default function OrbitScene({ stations }: { stations: Station[] }) {
  return (
    <Canvas camera={{ position: [0, 2.3, 3.4], fov: 45 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#f3eee6"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <torusGeometry args={[1.7, 0.015, 12, 80]} />
        <meshStandardMaterial color="#102027" />
      </mesh>
      <Stations stations={stations} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  );
}
