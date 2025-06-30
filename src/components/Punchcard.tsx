import React, { useEffect, useRef } from 'react'
import { drawPianoroll } from '@strudel/draw'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface PunchcardData {
  time: number
  value: string
  name?: string
}

interface PunchcardProps {
  data: Array<PunchcardData>
  isPlaying: boolean
  pattern?: any // The actual Strudel pattern for more advanced drawing
  currentTime?: number
}

export const Punchcard: React.FC<PunchcardProps> = ({ data, isPlaying, pattern, currentTime = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set up high DPI canvas
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return // Skip if not visible yet
    
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.scale(dpr, dpr)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Clear canvas with a visible background
    ctx.fillStyle = '#111827' // dark gray background
    ctx.fillRect(0, 0, rect.width, rect.height)

    console.log('Canvas rendering:', { 
      hasPattern: !!pattern, 
      dataLength: data.length, 
      canvasSize: { width: rect.width, height: rect.height }
    })

    // Always try custom drawing first for debugging
    drawCustomVisualization(ctx, data, currentTime, rect.width, rect.height)

    // Also try Strudel's drawPianoroll if pattern exists
    if (pattern && typeof pattern.queryArc === 'function') {
      try {
        const from = Math.max(0, currentTime - 2)
        const to = currentTime + 2
        const haps = pattern.queryArc(from, to)
        
        console.log('Strudel haps:', haps)
        
        if (haps && haps.length > 0) {
          // Overlay Strudel drawing on top of custom drawing
          drawPianoroll({
            haps,
            time: currentTime,
            ctx,
            drawTime: [-2, 2],
            cycles: 4,
            playhead: 0.5,
            fold: 1,
            labels: true,
            fill: 0.8,
            fillActive: 1,
            strokeActive: 1,
            active: '#8b5cf6',
            inactive: '#374151',
            background: 'transparent',
            playheadColor: '#ffffff',
            fontFamily: 'monospace',
            autorange: 1,
            vertical: 0
          })
        }
      } catch (error) {
        console.warn('Error with Strudel drawPianoroll:', error)
      }
    }
  }, [data, isPlaying, pattern, currentTime])

  const drawCustomVisualization = (
    ctx: CanvasRenderingContext2D, 
    eventData: Array<PunchcardData>, 
    time: number,
    width: number,
    height: number
  ) => {
    console.log('Drawing custom visualization:', { eventData, time, width, height })
    
    // Always draw something, even if no data
    if (eventData.length === 0) {
      // Draw a message indicating no data
      ctx.fillStyle = '#6b7280'
      ctx.font = '16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No pattern data available', width / 2, height / 2)
      
      // Draw some sample bars to show it's working
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(139, 92, 246, ${0.3 + i * 0.1})`
        ctx.fillRect(i * (width / 4) + 10, height * 0.7, width / 4 - 20, 20)
      }
      return
    }

    // Get unique instruments and assign colors
    const instruments = [...new Set(eventData.map(d => d.value))]
    const colors = [
      '#8b5cf6', // purple - bd (kick)
      '#06b6d4', // cyan - sd (snare)
      '#10b981', // emerald - hh (hihat)
      '#f59e0b', // amber - oh (open hihat)
      '#ef4444', // red
      '#ec4899', // pink
    ]

    const trackHeight = Math.max(40, height / Math.max(instruments.length, 1))
    const beatsVisible = 4 // Show 4 beats
    const timeScale = width / beatsVisible

    // Draw beat grid first
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= beatsVisible; i++) {
      const x = i * (width / beatsVisible)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw subdivisions (quarter notes)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    for (let i = 0; i < beatsVisible * 4; i++) {
      const x = i * (width / (beatsVisible * 4))
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    instruments.forEach((instrument, index) => {
      const y = index * trackHeight
      const color = colors[index % colors.length]
      
      // Draw track background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(0, y, width, trackHeight - 2)
      
      // Draw instrument label
      ctx.fillStyle = '#d1d5db'
      ctx.font = '14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(instrument, 8, y + 25)
      
      // Draw events for this instrument
      eventData
        .filter(event => event.value === instrument)
        .forEach(event => {
          const x = (event.time % beatsVisible) * timeScale
          const eventWidth = Math.max(12, timeScale / 8) // Make events more visible
          const eventHeight = trackHeight * 0.5
          
          // Highlight active events
          const isActive = isPlaying && Math.abs((time % beatsVisible) - (event.time % beatsVisible)) < 0.1
          
          if (isActive) {
            // Draw glow effect for active events
            ctx.shadowColor = color
            ctx.shadowBlur = 10
            ctx.fillStyle = color
          } else {
            ctx.shadowBlur = 0
            ctx.fillStyle = isPlaying ? `${color}80` : color // Semi-transparent when playing but not active
          }
          
          ctx.fillRect(x, y + trackHeight * 0.3, eventWidth, eventHeight)
          
          // Reset shadow
          ctx.shadowBlur = 0
        })
    })

    // Draw time indicator/playhead if playing
    if (isPlaying) {
      const currentX = (time % beatsVisible) * timeScale
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(currentX, 0)
      ctx.lineTo(currentX, height)
      ctx.stroke()
      
      // Add a small triangle at the top for the playhead
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(currentX - 6, 0)
      ctx.lineTo(currentX + 6, 0)
      ctx.lineTo(currentX, 12)
      ctx.closePath()
      ctx.fill()
    }
  }
  // Always show the component, even with no data (for debugging)
  return (
    <Card className="w-full max-w-4xl mx-auto bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Pattern Visualization
          {isPlaying && <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />}
        </CardTitle>
        <CardDescription className="text-gray-300">
          Canvas-based visualization showing your pattern timeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-gray-400 mb-4">
          {data.length} events • Canvas-based drawing • {isPlaying ? 'Playing' : 'Stopped'} • Pattern: {pattern ? 'Available' : 'Not available'}
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full border border-white/10 rounded bg-gray-900"
            style={{ height: '300px', minHeight: '300px' }}
          />
        </div>
        
        <div className="text-xs text-gray-500 pt-4 border-t border-white/10">
          Canvas visualization powered by Strudel's drawing engine. Each track represents a different instrument.
          {data.length === 0 && !pattern && (
            <div className="text-yellow-400 mt-2">Debug: No pattern data or Strudel pattern available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Punchcard
