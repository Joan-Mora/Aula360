"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function Courtyard() {
  const ring = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.18;
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]}>
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial color="#1C7C74" />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2.35, 0.2, 0]} position={[0, 0.15, 0]}>
        <torusGeometry args={[1.45, 0.03, 16, 90]} />
        <meshStandardMaterial color="#E08A2C" />
      </mesh>
      <mesh position={[-0.2, 0.05, 0.1]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#F3EEE6" />
      </mesh>
    </>
  );
}

export default function CampusScene() {
  return (
    <Canvas camera={{ position: [0, 1.15, 4.3], fov: 42 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#102027"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} />
      <Courtyard />
    </Canvas>
  );
}
