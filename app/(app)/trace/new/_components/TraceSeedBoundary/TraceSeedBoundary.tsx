'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { toSearchParamsRecord } from '@/app/_global/_services/searchParams.service'
import { parseTraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { TraceSourceView } from '../TraceSourceView/TraceSourceView'

/**
 * 흔적 보기 화면이 넘긴 씨앗을 URL에서 읽는 경계.
 *
 * 서버가 아니라 클라이언트에서 읽는다 — 클라이언트 내비게이션은 라우터가 URL을 이미 알고 있어
 * useSearchParams가 동기로 풀리므로, 첫 렌더부터 씨앗이 손에 있고 서버 왕복이 없다.
 * 서버 경계(await searchParams)였을 때는 씨앗이 없는 진입까지 매번 동적 RSC 응답을 기다려
 * 시트가 그만큼 늦게 떴다(dev 콜드스타트에서 +0.7~0.9초).
 *
 * useSearchParams는 프리렌더에서만 suspend한다(빌드 시점엔 쿼리를 모르므로). 그 경로(URL 직접
 * 로드)는 page의 Suspense 폴백이 하이드레이션까지 자리를 지킨다.
 */
export function TraceSeedBoundary() {
  const searchParams = useSearchParams()
  // URL이 그대로면 씨앗 객체도 같은 참조로 유지한다 — 씨앗 소비 effect가 렌더마다 헛돌지 않게.
  const seed = useMemo(() => parseTraceSeed(toSearchParamsRecord(searchParams)), [searchParams])
  return <TraceSourceView seed={seed} />
}
