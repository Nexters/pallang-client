'use client'

import { useRouter } from 'next/navigation'

import { cn } from '@/app/_global/_services/cn.service'

import { SORT_BAR_HEIGHT } from '../../_data/stage.constant'
import {
  CARD_HEIGHT,
  CARD_TOP_EXPANDED,
  CARD_WIDTH,
  PAPER_HEIGHT,
  px,
  STAGE_EXPANDED,
} from '../../_services/quoteCollapse.service'
import stageStyles from '../QuoteStage/QuoteStage.module.css'
import { TraceHeader } from '../TraceHeader/TraceHeader'

/** 스테이지 좌표는 모두 노치 인셋 위에 얹힌다 — QuoteStage.module.css와 같은 규칙 */
const belowSafeArea = (offset: number) => `calc(var(--safe-top) + ${px(offset)})`

/**
 * 흔적 화면의 로딩 골격 — 서버 프리페치(TracePrefetchBoundary)가 끝날 때까지 page.tsx의 Suspense fallback으로 선다.
 * fallback이 없으면 이 자리가 통째로 비어, 직접 진입에서는 빈 화면이 뜨고 링크 이동에서는 이전 화면이 멈춘 것처럼 보인다.
 * 좌표는 펼친 상태(--collapse: 0)의 스테이지와 같은 상수·같은 클래스를 쓰므로 실제 화면이 도착해도 자리가 튀지 않는다.
 *
 * 헤더의 뒤로 가기는 로딩 중에도 실제로 동작해야 한다 — 골격에도 화면 이동이 필요해 이 컴포넌트가 클라이언트다.
 */
export function TracePageSkeleton() {
  const router = useRouter()

  return (
    // 스테이지와 같은 방식으로 셸의 safe-area 패딩을 되돌려 모눈종이 자리를 노치 뒤까지 깐다
    <div className="-mt-(--safe-top) min-h-0 flex-1 overflow-hidden">
      <div className="relative bg-bg-dark" style={{ height: belowSafeArea(STAGE_EXPANDED) }}>
        {/* 모눈종이 자리 — 골격에서는 무늬 없이 걷히는 그라디언트만 세운다 */}
        <div
          className="absolute inset-x-0 top-0 bg-linear-to-b from-neutral-300 to-neutral-200"
          style={{ height: belowSafeArea(PAPER_HEIGHT) }}
        />
        {/* 헤더 자체는 데이터를 기다리지 않는다 — 실물을 세워 로딩 중에도 뒤로 갈 수 있게 하고,
            제목만 골격으로 둔다(책 제목은 대목 페이지 목록 응답과 함께 도착한다) */}
        <TraceHeader
          title={<span className="block h-5 w-32 rounded bg-black/10" />}
          onBack={() => {
            router.back()
          }}
          className="absolute inset-x-0 top-(--safe-top)"
        />
        {/* 포스트잇 카드 — 회전·테두리·그림자는 스테이지가 쓰는 클래스를 그대로 빌려 온다.
            --inv가 없으면 기본값 1, 곧 펼친 상태로 그려진다 */}
        <div
          className={cn(
            stageStyles['cardSurface'],
            'absolute left-1/2 flex -translate-x-1/2 flex-col gap-3 bg-bg-book-card px-6 py-10',
          )}
          style={{
            top: belowSafeArea(CARD_TOP_EXPANDED),
            width: px(CARD_WIDTH),
            height: px(CARD_HEIGHT),
          }}
        >
          <div className="h-5 w-full rounded bg-black/8" />
          <div className="h-5 w-full rounded bg-black/8" />
          <div className="h-5 w-2/3 rounded bg-black/8" />
        </div>
      </div>
      {/* 흔적 목록 정렬 바 자리 — 실제 목록도 같은 높이로 시작한다 */}
      <div className={cn('flex items-center justify-between px-4', SORT_BAR_HEIGHT)}>
        <div className="h-5 w-20 rounded bg-white/15" />
        <div className="h-5 w-14 rounded bg-white/15" />
      </div>
    </div>
  )
}
