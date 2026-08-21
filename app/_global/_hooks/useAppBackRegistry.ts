'use client'

import { use } from 'react'

import { AppBackContext, type AppBackRegistry } from '@/app/_global/_data/appBack.store'

export function useAppBackRegistry(): AppBackRegistry {
  const value = use(AppBackContext)
  if (!value) throw new Error('useAppBackRegistry는 AppBackProvider 안에서만 쓸 수 있습니다.')
  return value
}
