declare module '@strudel/web' {
  export function initStrudel(config: any): void
  export function samples(path: string): Promise<any>
  export function s(pattern: string): any
  export function hush(): void
  
  export interface StrudelPattern {
    play: () => void
    gain: (value: number) => StrudelPattern
    _punchcard?: () => Array<{ time: number; value: string; name?: string }>
    queryArc?: (from: number, to: number) => Array<{ whole: { begin: number; end: number }; part: { begin: number; end: number }; value: any }>
  }
}

declare module '@strudel/core' {
  export function evalScope(...modules: Array<any>): any
}

declare module '@strudel/draw' {
  export function drawPianoroll(options: {
    haps: Array<any>
    time: number
    ctx: CanvasRenderingContext2D
    drawTime: [number, number]
    cycles?: number
    playhead?: number
    fold?: number
    labels?: boolean
    fill?: number
    fillActive?: number
    strokeActive?: number
    active?: string
    inactive?: string
    background?: string
    playheadColor?: string
    fontFamily?: string
    autorange?: number
    vertical?: number
    flipTime?: number
    flipValues?: number
    hideNegative?: boolean
    smear?: number
    minMidi?: number
    maxMidi?: number
    stroke?: boolean
    hideInactive?: number
    colorizeInactive?: number
  }): void
}

declare module '@strudel/mini' {
  // Mini notation functions
}

declare module '@strudel/tonal' {
  // Tonal functions
}
