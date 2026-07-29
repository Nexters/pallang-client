// QueryClient 팩토리 — 서버 프리페치와 브라우저가 같은 기본 옵션을 공유한다.
// 서버: React cache()로 요청 스코프(같은 요청 안에서는 한 인스턴스, 요청 간에는 완전 격리).
//       모듈 싱글턴으로 두면 동시 요청이 남의 캐시(=남의 인증 데이터)를 본다.
// 브라우저: 탭 전체가 하나의 캐시를 공유해야 하므로 모듈 싱글턴.

import { environmentManager, QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

/** 하이드레이션 직후 프리페치한 쿼리를 즉시 다시 부르지 않을 만큼의 여유(SSR 이득 유지) */
const DEFAULT_STALE_TIME = 60 * 1000

/** 4xx는 다시 보내도 같은 답이라 재시도하지 않는다(ApiError.status 구조만 확인 — _apis 직접 import 금지) */
function isClientError(error: unknown): boolean {
  const status: unknown = (error as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        // 기본값(3회 + 지수 백오프)은 에러 화면까지 7초 가까이 걸린다. 한 번만 더 시도한다.
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
      },
    },
  })
}

const getServerQueryClient = cache(makeQueryClient)

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return getServerQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
