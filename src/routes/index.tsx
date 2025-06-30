import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Plus, Square, Trash2, Volume2 } from 'lucide-react'
import { hush, initStrudel, s, samples } from '@strudel/web'
import logo from '../logo.svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src={logo}
            className="h-16 pointer-events-none animate-[spin_20s_linear_infinite]"
            alt="The Beat Bakery Logo"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">The Beat Bakery</h1>
            <p className="text-lg text-gray-300">Cook up some beats with Strudel patterns</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Global Controls */}
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Global Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Global Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={playAll}
                  disabled={isPlaying || patterns.filter(p => p.pattern.trim()).length === 0}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Play All
                </Button>
                <Button
                  onClick={stopAll}
                  disabled={!isPlaying}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="mr-1 h-3 w-3" />
                  Stop All
                </Button>
              </div>
              
              <Button
                onClick={addPattern}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Pattern
              </Button>

              {/* Master Volume Control */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <Volume2 className="h-3 w-3" />
                  <span className="text-xs">Volume: {Math.round(volume[0] * 100)}%</span>
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
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isPlaying
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isPlaying ? '🎵 Playing' : '⏸️ Stopped'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sample Patterns Help */}
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Sample Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-sm">Basic Drums:</h4>
                  <div className="font-mono text-gray-300 space-y-1">
                    <div><code className="bg-black/30 px-1 py-0.5 rounded text-xs">bd sd [~ bd] sd</code></div>
                    <div><code className="bg-black/30 px-1 py-0.5 rounded text-xs">hh*8</code></div>
                    <div><code className="bg-black/30 px-1 py-0.5 rounded text-xs">oh ~ ~ hh</code></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-sm">Advanced:</h4>
                  <div className="font-mono text-gray-300 space-y-1">
                    <div><code className="bg-black/30 px-1 py-0.5 rounded text-xs">bd sd, hh*4</code></div>
                    <div><code className="bg-black/30 px-1 py-0.5 rounded text-xs">bd(&lt;3 5&gt;,8)</code></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Links */}
          <div className="flex flex-col gap-2 text-xs">
            <a
              className="text-blue-300 hover:text-blue-200 hover:underline text-center"
              href="https://strudel.cc/learn/samples/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn Strudel Patterns
            </a>
            <a
              className="text-blue-300 hover:text-blue-200 hover:underline text-center"
              href="https://strudel.cc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Strudel REPL
            </a>
          </div>
        </div>

        {/* Right Column - Pattern Cards */}
        <div className="lg:col-span-2 space-y-3">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={pattern.name}
                    onChange={(e) => updatePattern(pattern.id, 'name', e.target.value)}
                    className="text-lg font-semibold bg-transparent text-white border-none outline-none hover:bg-white/10 px-2 py-1 rounded flex-1"
                    placeholder="Pattern Name"
                  />
                  <Button
                    onClick={() => removePattern(pattern.id)}
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Pattern Input */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-300">
                    Strudel Pattern:
                  </label>
                  <textarea
                    value={pattern.pattern}
                    onChange={(e) => updatePattern(pattern.id, 'pattern', e.target.value)}
                    className="w-full h-12 px-2 py-1 bg-black/30 border border-white/20 rounded-md text-white placeholder-gray-400 font-mono text-sm resize-none"
                    placeholder='e.g. "bd sd [~ bd] sd" or "hh*8"'
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
