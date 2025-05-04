"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Asteroid } from "@/lib/types"
import * as THREE from "three"

interface AsteroidFieldProps {
  asteroids: Asteroid[]
  onMineAsteroid: (id: number) => void
}

export default function AsteroidField({ asteroids, onMineAsteroid }: AsteroidFieldProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Slowly rotate the entire asteroid field
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01
    }
  })

  return (
    <group ref={groupRef}>
      {asteroids.map((asteroid) => (
        <SingleAsteroid key={asteroid.id} asteroid={asteroid} onMine={() => onMineAsteroid(asteroid.id)} />
      ))}
    </group>
  )
}

interface AsteroidProps {
  asteroid: Asteroid
  onMine: () => void
}

function SingleAsteroid({ asteroid, onMine }: AsteroidProps) {
  const asteroidRef = useRef<THREE.Mesh>(null)

  // Create a unique rotation speed for each asteroid
  const rotationSpeed = useRef({
    x: Math.random() * 0.01,
    y: Math.random() * 0.01,
    z: Math.random() * 0.01,
  })

  // Calculate size based on resources
  const size = 0.3 + (asteroid.resources / 100) * 0.7

  // Rotate each asteroid individually
  useFrame((_, delta) => {
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += rotationSpeed.current.x
      asteroidRef.current.rotation.y += rotationSpeed.current.y
      asteroidRef.current.rotation.z += rotationSpeed.current.z
    }
  })

  // Calculate color based on resources
  const resourceColor = new THREE.Color().setHSL(
    0.1, // Hue (brownish)
    0.5, // Saturation
    0.2 + (asteroid.resources / 200) * 0.3, // Lightness based on resources
  )

  return (
    <mesh
      ref={asteroidRef}
      position={[asteroid.position.x, asteroid.position.y, asteroid.position.z]}
      onClick={onMine}
      castShadow
    >
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={resourceColor} roughness={0.9} metalness={0.1 + (asteroid.resources / 100) * 0.4} />

      {/* Resource indicator */}
      {asteroid.resources > 0 && (
        <pointLight color="#88aaff" intensity={0.2 + (asteroid.resources / 100) * 0.3} distance={2} />
      )}
    </mesh>
  )
}
