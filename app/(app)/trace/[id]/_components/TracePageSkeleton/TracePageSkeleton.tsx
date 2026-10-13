'use client'

import { useRouter } from 'next/navigation'

import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

import {
  BAND_HEIGHT,
  CARD_HEIGHT,
  CARD_TOP,
  CARD_WIDTH,
  PAGER_TOP,
  PAGER_WIDTH,
  px,
  STAGE_HEIGHT,
} from '../../_data/quoteStage.constant'
import { TraceHeader } from '../TraceHeader/TraceHeader'

/** 무대 좌표는 모두 노치 인셋 위에 얹힌다 — QuoteStage와 같은 규칙 */
const belowSafeArea = (offset: number) => `calc(var(--safe-top) + ${px(offset)})`

/**
 * 흔적 화면의 로딩 골격 — 서버 프리페치(TracePrefetchBoundary)가 끝날 때까지 page.tsx의 Suspense fallback으로 선다.
 * fallback이 없으면 이 자리가 통째로 비어, 직접 진입에서는 빈 화면이 뜨고 링크 이동에서는 이전 화면이 멈춘 것처럼 보인다.
 * 좌표는 무대와 같은 상수(quoteStage.constant)를 쓰므로 실제 화면이 도착해도 자리가 튀지 않는다.
 *
 * 헤더의 뒤로 가기는 로딩 중에도 실제로 동작해야 한다 — 골격에도 화면 이동이 필요해 이 컴포넌트가 클라이언트다.
 */
export function TracePageSkeleton() {
  const router = useRouter()

  return (
    // 무대와 같은 방식으로 셸의 safe-area 패딩을 되돌려 주황 밴드를 노치 뒤까지 깐다
    <div className="-mt-(--safe-top) flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="relative shrink-0 bg-bg-default"
        style={{ height: belowSafeArea(STAGE_HEIGHT) }}
      >
        <div
          className="absolute inset-x-0 top-0 bg-interactive-accent"
          style={{ height: belowSafeArea(BAND_HEIGHT) }}
        />
        {/* 헤더 자체는 데이터를 기다리지 않는다 — 실물을 세워 로딩 중에도 뒤로 갈 수 있게 하고,
            제목만 골격으로 둔다(책 제목은 대목 페이지 목록 응답과 함께 도착한다) */}
        <TraceHeader
          title={<Skeleton className="h-5 w-32" />}
          onBack={() => {
            router.back()
          }}
          className="absolute inset-x-0 top-(--safe-top) h-11 py-0"
        />
        {/* 포스트잇 카드 — 겉모습은 무대의 카드와 같은 한 벌이다 */}
        <div
          className="absolute left-1/2 flex -translate-x-1/2 flex-col gap-3 rounded-[4px] border border-border-book bg-bg-book-card px-6 py-10 drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
          style={{
            top: belowSafeArea(CARD_TOP),
            width: px(CARD_WIDTH),
            height: px(CARD_HEIGHT),
          }}
        >
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        {/* 대목 페이저 자리 — 가운데 "01 / 05"만 골격으로 두고 화살표는 비운다 */}
        <div
          className="absolute left-1/2 flex -translate-x-1/2 justify-center"
          style={{ top: belowSafeArea(PAGER_TOP), width: px(PAGER_WIDTH) }}
        >
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
      {/* 어두운 패널 자리 — handle과 정렬 바까지 실제 목록과 같은 높이로 시작한다 */}
      <div className="min-h-0 flex-1 rounded-t-[32px] bg-bg-dark">
        <div className="flex justify-center pt-4">
          <span className="h-[3px] w-8 rounded-full bg-bg-tertiary" />
        </div>
        {/* h-15는 TraceListSection의 정렬 바 높이 — 같아야 도착했을 때 자리가 튀지 않는다 */}
        <div className="flex h-15 items-center justify-between px-4">
          <Skeleton tone="dark" className="h-5 w-20" />
          <Skeleton tone="dark" className="h-5 w-14" />
        </div>
      </div>
    </div>
  )
}
