'use client'

import { use } from 'react'

import {
  HardwareBackContext,
  type HardwareBackRegistry,
} from '@/app/_global/_data/hardwareBack.store'

export function useHardwareBackRegistry(): HardwareBackRegistry {
  const value = use(HardwareBackContext)
  if (!value)
    throw new Error('useHardwareBackRegistry는 HardwareBackProvider 안에서만 쓸 수 있습니다.')
  return value
}
