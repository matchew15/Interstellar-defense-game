"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

interface TouchState {
  active: boolean
  startTime: number
  startPosition: { x: number; y: number }
  lastPosition: { x: number; y: number }
  pinchDistance: number | null
  pinchMidpoint: { x: number; y: number } | null
}

export function useTouchControls(
  domElement: React.RefObject<HTMLDivElement>,
  enabled = true,
  sensitivity: { zoom: number; rotate: number } = { zoom: 1, rotate: 1 },
) {
  const three = useThree()
  const camera = three.camera
  const touchState = useRef<TouchState>({
    active: false,
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    pinchDistance: null,
    pinchMidpoint: null,
  })
  const [isTouching, setIsTouching] = useState(false)

  useEffect(() => {
    if (!enabled || !domElement.current) return

    const element = domElement.current

    // Calculate distance between two touch points
    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX
      const dy = touch1.clientY - touch2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    // Calculate midpoint between two touch points
    const getTouchMidpoint = (touch1: Touch, touch2: Touch) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      }
    }

    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - track for swipe
        touchState.current = {
          active: true,
          startTime: Date.now(),
          startPosition: { x: e.touches[0].clientX, y: e.touches[0].clientY },
          lastPosition: { x: e.touches[0].clientX, y: e.touches[0].clientY },
          pinchDistance: null,
          pinchMidpoint: null,
        }
        setIsTouching(true)
      } else if (e.touches.length === 2) {
        // Pinch gesture - track for zoom
        const distance = getTouchDistance(e.touches[0], e.touches[1])
        const midpoint = getTouchMidpoint(e.touches[0], e.touches[1])

        touchState.current = {
          ...touchState.current,
          active: true,
          pinchDistance: distance,
          pinchMidpoint: midpoint,
        }
        setIsTouching(true)
      }
    }

    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchState.current.active) return

      if (e.touches.length === 1 && touchState.current.pinchDistance === null) {
        // Handle swipe (camera rotation)
        const touch = e.touches[0]
        const deltaX = touch.clientX - touchState.current.lastPosition.x
        const deltaY = touch.clientY - touchState.current.lastPosition.y

        // Update orbit controls or camera directly
        if (camera instanceof THREE.PerspectiveCamera) {
          // Rotate camera around target point
          const rotationSpeed = 0.005 * sensitivity.rotate

          // Create a temporary vector for camera position
          const tempVector = new THREE.Vector3().copy(camera.position)

          // Rotate around Y axis (left/right)
          tempVector.sub(new THREE.Vector3(0, 0, 0)) // Subtract target (planet at origin)
          tempVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * rotationSpeed)
          tempVector.add(new THREE.Vector3(0, 0, 0)) // Add target back

          // Rotate around X axis (up/down) with limits
          const upVector = new THREE.Vector3(0, 1, 0)
          const rightVector = new THREE.Vector3().crossVectors(camera.up, tempVector.clone().normalize())
          tempVector.sub(new THREE.Vector3(0, 0, 0))
          tempVector.applyAxisAngle(rightVector, -deltaY * rotationSpeed)
          tempVector.add(new THREE.Vector3(0, 0, 0))

          // Apply the new position if it's within bounds
          const angle = tempVector.y / tempVector.length()
          if (angle > 0.1 && angle < 0.9) {
            // Limit vertical rotation
            camera.position.copy(tempVector)
            camera.lookAt(0, 0, 0)
          }
        }

        // Update last position
        touchState.current.lastPosition = { x: touch.clientX, y: touch.clientY }
      } else if (e.touches.length === 2 && touchState.current.pinchDistance !== null) {
        // Handle pinch (zoom)
        const newDistance = getTouchDistance(e.touches[0], e.touches[1])
        const newMidpoint = getTouchMidpoint(e.touches[0], e.touches[1])

        // Calculate zoom factor
        const zoomDelta = (touchState.current.pinchDistance - newDistance) * 0.01 * sensitivity.zoom

        // Apply zoom by adjusting camera position
        if (camera instanceof THREE.PerspectiveCamera) {
          const zoomSpeed = 0.1
          const direction = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize()
          const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0))

          // Calculate new distance with limits
          const newDist = Math.max(5, Math.min(20, distance + zoomDelta * zoomSpeed * distance))

          // Set new camera position
          camera.position.copy(direction.multiplyScalar(newDist))
          camera.lookAt(0, 0, 0)
        }

        // Update pinch state
        touchState.current.pinchDistance = newDistance
        touchState.current.pinchMidpoint = newMidpoint
      }
    }

    // Handle touch end
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchState.current.active = false
        setIsTouching(false)
      } else if (e.touches.length === 1) {
        // Switched from pinch to single touch
        touchState.current = {
          active: true,
          startTime: Date.now(),
          startPosition: { x: e.touches[0].clientX, y: e.touches[0].clientY },
          lastPosition: { x: e.touches[0].clientX, y: e.touches[0].clientY },
          pinchDistance: null,
          pinchMidpoint: null,
        }
      }
    }

    // Add event listeners
    element.addEventListener("touchstart", handleTouchStart, { passive: false })
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd)
    element.addEventListener("touchcancel", handleTouchEnd)

    // Clean up
    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
      element.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [camera, enabled, domElement, sensitivity])

  return { isTouching }
}
