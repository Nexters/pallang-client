'use client'

import { createContext } from 'react'

import type { Photo } from '@/app/_global/_hooks/useCamera'

/** 시작해 둔 촬영을 다음 화면으로 넘기는 자리. 사진(값)이 아니라 '진행 중인 촬영'을 넘긴다. */
export type TraceCaptureHandoff = {
  /** 탭 핸들러에서 막 시작한 촬영을 맡긴다. 맡겨 둔 것이 있으면 덮어쓴다. */
  hand: (capture: Promise<null | Photo>) => void
  /** 맡겨 둔 촬영을 한 번만 꺼낸다. 없으면 null. */
  take: () => Promise<null | Photo> | null
}

export const TraceCaptureContext = createContext<TraceCaptureHandoff | null>(null)
