"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere } from "@react-three/drei"
import * as THREE from "three"

interface PlanetProps {
  position: [number, number, number]
  health: number
  shieldActive: boolean
  shieldStrength: number
}

// Make planet more visible on mobile
export default function Planet({ position, health, shieldActive, shieldStrength }: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null)
  const shieldRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.1
    }

    if (shieldRef.current) {
      shieldRef.current.rotation.y -= delta * 0.05
      shieldRef.current.rotation.z += delta * 0.03
    }
  })

  // Calculate planet color based on health
  const healthColor = new THREE.Color().setHSL(
    health / 300, // Hue (green to red)
    0.8, // Saturation
    0.6, // Lightness - increased for better visibility on mobile
  )

  return (
    <group position={position}>
      {/* Planet */}
      <Sphere ref={planetRef} args={[1.2, 32, 32]} receiveShadow castShadow>
        <meshStandardMaterial
          color={healthColor}
          roughness={0.7}
          metalness={0.3}
          emissive={healthColor}
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Shield */}
      {shieldActive && (
        <Sphere ref={shieldRef} args={[1.8, 32, 32]}>
          <meshStandardMaterial
            color="#4080ff"
            transparent={true}
            opacity={0.4 + shieldStrength * 0.1}
            emissive="#4080ff"
            emissiveIntensity={0.7}
            side={THREE.DoubleSide}
            wireframe={true}
          />
        </Sphere>
      )}

      {/* Add a point light to make planet more visible */}
      <pointLight color={healthColor} intensity={0.5} distance={5} />
    </group>
  )
}
