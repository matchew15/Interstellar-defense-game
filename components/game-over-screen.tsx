"use client"

import { Button } from "@/components/ui/button"
import { Rocket } from "lucide-react"

interface GameOverScreenProps {
  score: number
  wave: number
  onRestart: () => void
}

export default function GameOverScreen({ score, wave, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg border border-red-500 max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">GAME OVER</h2>
        <p className="text-lg mb-2">Your planet has been destroyed!</p>
        <div className="mb-6 space-y-2">
          <p className="text-xl">
            Final Score: <span className="text-yellow-400">{score.toLocaleString()}</span>
          </p>
          <p className="text-lg">
            Waves Survived: <span className="text-blue-400">{wave}</span>
          </p>
        </div>
        <Button onClick={onRestart} className="bg-red-700 hover:bg-red-600">
          <Rocket className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
