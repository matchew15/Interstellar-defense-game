"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { PowerUp as PowerUpType } from "@/lib/types"
import type * as THREE from "three"

interface PowerUpProps {
  powerUp: PowerUpType
}

export default function PowerUp({ powerUp }: PowerUpProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Rotate and bob the power-up
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 2
      groupRef.current.position.y = powerUp.position.y + Math.sin(Date.now() / 500) * 0.2
    }
  })

  // Color based on power-up type
  const color =
    powerUp.type === "health"
      ? "#00ff00"
      : powerUp.type === "resources"
        ? "#ffff00"
        : powerUp.type === "shield"
          ? "#4080ff"
          : "#ff00ff" // damage

  return (
    <group ref={groupRef} position={[powerUp.position.x, powerUp.position.y, powerUp.position.z]}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* Inner core */}
      <mesh>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Point light */}
      <pointLight color={color} intensity={1} distance={3} />
    </group>
  )
}
