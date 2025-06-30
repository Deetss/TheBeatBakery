import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Plus, Square, Trash2, Volume2 } from 'lucide-react'
import { hush, initStrudel, s, samples } from '@strudel/web'
import logo from '../logo.svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

export const Route = createFileRoute('/')({
  component: App,
})

// Initialize Strudel outside of component
initStrudel({
  prebake: () => samples('github:tidalcycles/dirt-samples'),
})

interface PatternInput {
  id: string
  pattern: string
  name: string
}

function App() {
  const [patterns, setPatterns] = useState<Array<PatternInput>>([
    {
      id: '1',
      pattern: 'bd sd [~ bd] sd',
      name: 'Kick & Snare'
    },
    {
      id: '2', 
      pattern: 'hh*8',
      name: 'Hi-hats'
    }
  ])
  const [volume, setVolume] = useState([0.7])
  const [nextId, setNextId] = useState(3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [combinedPattern, setCombinedPattern] = useState<any>(null)
  
  // Use refs to avoid dependency cycles
  const patternsRef = useRef(patterns)
  const volumeRef = useRef(volume[0])
  
  // Update refs when state changes
  useEffect(() => {
    patternsRef.current = patterns
  }, [patterns])
  
  useEffect(() => {
    volumeRef.current = volume[0]
  }, [volume])

  const createAndPlayPattern = useCallback(() => {
    const validPatterns = patternsRef.current.filter(p => p.pattern.trim())
    if (validPatterns.length === 0) return null

    try {
      // Combine all patterns using Strudel's stack function
      let combined
      if (validPatterns.length === 1) {
        combined = s(validPatterns[0].pattern)
      } else {
        // Stack all patterns together
        const patternStrings = validPatterns.map(p => p.pattern)
        combined = s(patternStrings.join(', ')) // Simple comma separation for layering
      }
      
      const finalPattern = combined.gain(volumeRef.current)
      return finalPattern
    } catch (error) {
      console.error('Error creating pattern:', error)
      return null
    }
  }, [])

  const playAll = useCallback(() => {
    const pattern = createAndPlayPattern()
    if (!pattern) {
      alert('No valid patterns to play')
      return
    }

    try {
      pattern.play()
      setCombinedPattern(pattern)
      setIsPlaying(true)
    } catch (error) {
      console.error('Error playing patterns:', error)
      alert('Error playing patterns. Please check your syntax.')
    }
  }, [createAndPlayPattern])

  const stopAll = useCallback(() => {
    if (combinedPattern) {
      combinedPattern.stop?.()
    }
    hush() // Stop all patterns
    setIsPlaying(false)
    setCombinedPattern(null)
  }, [combinedPattern])

  const addPattern = useCallback(() => {
    const newPattern: PatternInput = {
      id: nextId.toString(),
      pattern: '',
      name: `Pattern ${nextId}`
    }
    setPatterns([...patterns, newPattern])
    setNextId(nextId + 1)
  }, [nextId, patterns])

  const removePattern = useCallback((id: string) => {
    // Stop all if playing when removing a pattern
    if (isPlaying) {
      stopAll()
    }
    setPatterns(patterns.filter(p => p.id !== id))
  }, [isPlaying, patterns, stopAll])

  const updatePattern = useCallback((id: string, field: keyof PatternInput, value: string) => {
    setPatterns(patterns.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }, [patterns])

  // No volume update effect needed - volume is applied when pattern is created

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8">
        {/* Logo */}
        <img
          src={logo}
          className="h-32 mx-auto pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="The Beat Bakery Logo"
        />
        
        <h1 className="text-4xl font-bold text-white mb-2">The Beat Bakery</h1>
        <p className="text-xl text-gray-300 mb-8">Cook up some beats with Strudel patterns</p>

        {/* Global Controls */}
        <Card className="w-full max-w-md mx-auto bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Global Controls</CardTitle>
            <CardDescription className="text-gray-300">
              Master volume and stop all patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global Controls */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={playAll}
                disabled={isPlaying || patterns.filter(p => p.pattern.trim()).length === 0}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Play All
              </Button>
              <Button
                onClick={stopAll}
                disabled={!isPlaying}
                size="lg"
                variant="destructive"
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop All
              </Button>
              <Button
                onClick={addPattern}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>

            {/* Master Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Master Volume: {Math.round(volume[0] * 100)}%</span>
              </div>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Status */}
            <div className="text-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isPlaying
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isPlaying ? '🎵 Playing All' : '⏸️ All Stopped'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pattern Cards */}
        <div className="w-full max-w-6xl mx-auto space-y-4">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={pattern.name}
                      onChange={(e) => updatePattern(pattern.id, 'name', e.target.value)}
                      className="text-lg font-semibold bg-transparent text-white border-none outline-none hover:bg-white/10 px-2 py-1 rounded"
                      placeholder="Pattern Name"
                    />
                  </div>
                  <Button
                    onClick={() => removePattern(pattern.id)}
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pattern Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Strudel Pattern:
                  </label>
                  <textarea
                    value={pattern.pattern}
                    onChange={(e) => updatePattern(pattern.id, 'pattern', e.target.value)}
                    className="w-full h-20 px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white placeholder-gray-400 font-mono text-sm resize-none"
                    placeholder='Enter Strudel pattern... e.g. "bd sd [~ bd] sd" or "hh*8"'
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Patterns Help */}
        <Card className="w-full max-w-4xl mx-auto bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Sample Patterns</CardTitle>
            <CardDescription className="text-gray-300">
              Try these example patterns to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Drum Patterns:</h4>
                <div className="font-mono text-gray-300 space-y-1">
                  <div><code className="bg-black/30 px-2 py-1 rounded">bd sd [~ bd] sd</code> - Basic kick & snare</div>
                  <div><code className="bg-black/30 px-2 py-1 rounded">hh*8</code> - Fast hi-hats</div>
                  <div><code className="bg-black/30 px-2 py-1 rounded">oh ~ ~ hh</code> - Open/closed hats</div>
                  <div><code className="bg-black/30 px-2 py-1 rounded">bd*2 sd</code> - Double kick</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Advanced:</h4>
                <div className="font-mono text-gray-300 space-y-1">
                  <div><code className="bg-black/30 px-2 py-1 rounded">bd sd, hh*4</code> - Polyrhythm</div>
                  <div><code className="bg-black/30 px-2 py-1 rounded">bd(&lt;3 5&gt;,8)</code> - Euclidean</div>
                  <div><code className="bg-black/30 px-2 py-1 rounded">s("bd sd").speed("1 2")</code> - Speed change</div>
                  <div><code className="bg-black/30 px-2 py-1 rounded">"bd sd".bank("RolandTR808")</code> - Sound bank</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Links */}
        <div className="flex gap-6 justify-center text-sm">
          <a
            className="text-blue-300 hover:text-blue-200 hover:underline"
            href="https://strudel.cc/learn/samples/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Strudel Patterns
          </a>
          <a
            className="text-blue-300 hover:text-blue-200 hover:underline"
            href="https://strudel.cc/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Strudel REPL
          </a>
        </div>
      </div>
    </div>
  )
}
