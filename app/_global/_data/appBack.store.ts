'use client'

import { createContext } from 'react'

export type AppBackRegistry = {
  /** back을 가로챌 핸들러를 등록하고, 해제 함수를 돌려준다. 나중에 등록한 쪽이 우선이다. */
  register: (handler: () => void) => () => void
  /**
   * 앱이 스스로 한 칸 되감을 때 쓴다. `router.back()`을 그대로 부르면 그 되감기를 자기 가드가
   * 가로채 화면이 제자리에 남으므로, 심어 둔 엔트리를 함께 걷어낸다.
   * 되돌아갈 자리가 없으면 아무 것도 하지 않고 `false`를 준다 — 부른 쪽이 다른 길을 고를 수 있다.
   */
  back: () => boolean
}

export const AppBackContext = createContext<AppBackRegistry | null>(null)
