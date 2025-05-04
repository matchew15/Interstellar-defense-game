"use client"

import { Button } from "@/components/ui/button"
import { Rocket } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface StartScreenProps {
  onStart: () => void
  difficulty: "easy" | "normal" | "hard"
  onSetDifficulty: (difficulty: "easy" | "normal" | "hard") => void
}

export default function StartScreen({ onStart, difficulty, onSetDifficulty }: StartScreenProps) {
  // Local state to track selected difficulty
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "normal" | "hard">(difficulty)

  // Update local state when prop changes
  useEffect(() => {
    setSelectedDifficulty(difficulty)
  }, [difficulty])

  // Handle difficulty change
  const handleDifficultyChange = (value: string) => {
    const newDifficulty = value as "easy" | "normal" | "hard"
    setSelectedDifficulty(newDifficulty)
    onSetDifficulty(newDifficulty)
  }

  return (
    <div className="absolute inset-0 bg-black/70 z-30 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg border border-blue-500 max-w-md text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-2">INTERSTELLAR DEFENSE SYSTEM</h2>
        <p className="mb-6 text-gray-300">Protect your planet from waves of enemy ships!</p>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Select Difficulty</h3>
          <RadioGroup
            value={selectedDifficulty}
            onValueChange={handleDifficultyChange}
            className="flex justify-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="easy" id="easy" />
              <Label htmlFor="easy">Easy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal">Normal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hard" id="hard" />
              <Label htmlFor="hard">Hard</Label>
            </div>
          </RadioGroup>
        </div>

        <Button onClick={onStart} className="bg-blue-700 hover:bg-blue-600">
          <Rocket className="mr-2 h-4 w-4" />
          Launch Defense
        </Button>
      </div>
    </div>
  )
}
