"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface PauseScreenProps {
  onResume: () => void
}

export default function PauseScreen({ onResume }: PauseScreenProps) {
  return (
    <div className="absolute inset-0 bg-black/70 z-30 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg border border-blue-500 max-w-md text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-4">GAME PAUSED</h2>
        <Button onClick={onResume} className="bg-blue-700 hover:bg-blue-600">
          <Play className="mr-2 h-4 w-4" />
          Resume Game
        </Button>
      </div>
    </div>
  )
}
