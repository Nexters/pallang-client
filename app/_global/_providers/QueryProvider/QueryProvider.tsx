'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { getQueryClient } from '@/app/_global/_services/queryClient.service'

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState 대신 팩토리 — 서버 프리페치(요청 스코프)와 브라우저(싱글턴)가 같은 기본 옵션을 쓴다.
  // 브라우저에서는 싱글턴이라 suspend 후 재실행돼도 새 클라이언트가 만들어지지 않는다.
  const queryClient = getQueryClient()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
