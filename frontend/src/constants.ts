import type { ComponentType } from 'react'
import { categoryShapeComponent, CATEGORY_SHAPE } from './components/shapes'
import type { Category } from './types'

export { categoryShapeComponent, CATEGORY_SHAPE }

export const CATEGORY_COLOR: Record<Category, string> = {
  conflict:  '#e05252',
  protest:   '#e09652',
  disaster:  '#e0c852',
  political: '#7c9ef8',
  economic:  '#52c8a0',
  crime:     '#c852c8',
  general:   '#888888',
}

// Alias for backward compat
export const CATEGORY_ICON = CATEGORY_SHAPE

export function categoryColor(cat: string): string {
  return (CATEGORY_COLOR as Record<string, string>)[cat] ?? CATEGORY_COLOR.general
}

export function categoryIcon(cat: string): ComponentType<{ size?: number; color?: string }> {
  return categoryShapeComponent(cat)
}

export function intensityColor(v: number): string {
  if (v > 0.7) return '#e05252'
  if (v > 0.4) return '#e0c852'
  return '#52c8a0'
}
