'use client'

import { useState } from 'react'

import type { Example } from '../_types/example.type'

export function useExample(initial: Example[]): { items: Example[] } {
  const [items] = useState(initial)
  return { items }
}
