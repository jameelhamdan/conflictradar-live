import type { ComponentType } from 'react'
import type { Category } from '../types'

type ShapeProps = { size?: number; color?: string }

export function TriangleShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <polygon points="16,2 30,28 2,28" fill={color} />
    </svg>
  )
}

export function DiamondShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <polygon points="16,2 30,16 16,30 2,16" fill={color} />
    </svg>
  )
}

export function StarShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <polygon points="16,2 19,13 30,16 19,19 16,30 13,19 2,16 13,13" fill={color} />
    </svg>
  )
}

export function SquareShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="3" y="3" width="26" height="26" rx="3" fill={color} />
    </svg>
  )
}

export function CircleShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="16" cy="16" r="13" fill={color} />
    </svg>
  )
}

export function HexagonShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill={color} />
    </svg>
  )
}

export function RingShape({ size = 16, color = 'currentColor' }: ShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="16" cy="16" r="13" fill={color} opacity={0.35} />
      <circle cx="16" cy="16" r="7" fill={color} />
    </svg>
  )
}

export const CATEGORY_SHAPE: Record<Category, ComponentType<ShapeProps>> = {
  conflict:  TriangleShape,
  protest:   DiamondShape,
  disaster:  StarShape,
  political: SquareShape,
  economic:  CircleShape,
  crime:     HexagonShape,
  general:   RingShape,
}

export function categoryShapeComponent(cat: string): ComponentType<ShapeProps> {
  return (CATEGORY_SHAPE as Record<string, ComponentType<ShapeProps>>)[cat] ?? RingShape
}

// SVG string for L.divIcon (bypasses React rendering)
const SHAPE_PATHS: Record<string, (color: string, stroke: string) => string> = {
  conflict:  (c, s) => `<polygon points="16,2 30,28 2,28" fill="${c}" ${s}/>`,
  protest:   (c, s) => `<polygon points="16,2 30,16 16,30 2,16" fill="${c}" ${s}/>`,
  disaster:  (c, s) => `<polygon points="16,2 19,13 30,16 19,19 16,30 13,19 2,16 13,13" fill="${c}" ${s}/>`,
  political: (c, s) => `<rect x="3" y="3" width="26" height="26" rx="3" fill="${c}" ${s}/>`,
  economic:  (c, s) => `<circle cx="16" cy="16" r="13" fill="${c}" ${s}/>`,
  crime:     (c, s) => `<polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="${c}" ${s}/>`,
  general:   (c, _) => `<circle cx="16" cy="16" r="13" fill="${c}" opacity="0.4"/><circle cx="16" cy="16" r="7" fill="${c}"/>`,
}

export function categoryShapeSvg(category: string, size: number, color: string, selected: boolean): string {
  const stroke = selected
    ? `stroke="rgba(255,255,255,0.85)" stroke-width="2.5"`
    : `stroke="rgba(255,255,255,0.18)" stroke-width="1"`
  const shadow = selected
    ? `drop-shadow(0 0 7px ${color}99) drop-shadow(0 2px 5px rgba(0,0,0,0.7))`
    : `drop-shadow(0 2px 5px rgba(0,0,0,0.65))`
  const path = (SHAPE_PATHS[category] ?? SHAPE_PATHS.general)(color, stroke)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" style="display:block;filter:${shadow};cursor:pointer">${path}</svg>`
}
