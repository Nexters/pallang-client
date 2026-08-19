'use client'

import type { ReactNode, RefObject } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { RecordListSkeleton } from '@/app/_shared/user/_components/RecordListSkeleton/RecordListSkeleton'

type RecordPanelProps = {
  /** 오류 안내를 가리키는 이름 — 세 탭이 같은 자리를 쓰므로 어느 탭인지 구분되어야 한다 */
  label: string
  /** 시안(225:13472 · 225:13647)의 빈 상태는 일러스트 없이 문구 한 줄뿐이다 */
  emptyMessage: string
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  onRetry: () => void
  /** 목록 끝 sentinel에 붙일 ref — 다음 페이지를 언제 부를지는 패널이 정한다 */
  loadMoreRef: RefObject<HTMLDivElement | null>
  /** `<li>` 카드 목록 */
  children: ReactNode
}

/**
 * 세 탭(의견·좋아요·스포일러)이 함께 쓰는 목록 자리.
 * 카드 생김새만 탭마다 다르고 골격·오류·빈 상태·무한 스크롤 sentinel은 같아 여기서 한 번만 그린다.
 */
export function RecordPanel({
  label,
  emptyMessage,
  isPending,
  isError,
  isEmpty,
  onRetry,
  loadMoreRef,
  children,
}: RecordPanelProps) {
  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  if (isPending) return <RecordListSkeleton />
  if (isError && isEmpty) {
    return (
      <ApiErrorFeedbackState
        aria-label={`${label} 오류`}
        title="목록을 불러오지 못했어요."
        onRetry={onRetry}
      />
    )
  }
  if (isEmpty) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-title-18md text-text-secondary">
        {emptyMessage}
      </p>
    )
  }
  return (
    <>
      <ul className="flex flex-col gap-2">{children}</ul>
      {/* 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다 */}
      <div ref={loadMoreRef} aria-hidden className="h-6 w-full shrink-0" />
    </>
  )
}
