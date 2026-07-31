'use client'

import { createContext } from 'react'

export type HardwareBackRegistry = {
  /** back을 가로챌 핸들러를 등록하고, 해제 함수를 돌려준다. 나중에 등록한 쪽이 우선이다. */
  register: (handler: () => void) => () => void
}

export const HardwareBackContext = createContext<HardwareBackRegistry | null>(null)
