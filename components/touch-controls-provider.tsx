"use client"

import type React from "react"
import { useTouchControls } from "@/hooks/use-touch-controls"
import { useMobile } from "@/hooks/use-mobile"

interface TouchControlsProviderProps {
  domElement: React.RefObject<HTMLDivElement>
}

export default function TouchControlsProvider({ domElement }: TouchControlsProviderProps) {
  const isMobile = useMobile()

  // Only enable touch controls on mobile devices
  const { isTouching } = useTouchControls(domElement, isMobile, {
    zoom: 1.5, // Adjust sensitivity for zoom
    rotate: 1.2, // Adjust sensitivity for rotation
  })

  return null // This component doesn't render anything, it just sets up the touch controls
}
