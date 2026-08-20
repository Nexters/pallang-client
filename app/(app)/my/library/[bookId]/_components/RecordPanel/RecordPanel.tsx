'use client'

import type { ReactNode, RefObject } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { RecordListSkeleton } from '@/app/_shared/user/_components/RecordListSkeleton/RecordListSkeleton'

type RecordPanelProps = {
  /** 오류 안내를 가리키는 이름 — 세 탭이 같은 자리를 쓰므로 어느 탭인지 구분되어야 한다 */
  label: string
  /** 시안의 빈 상태는 일러스트 없이 문구 한 줄뿐이다 */
  emptyMessage: string
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  /** 재시도가 도는 중인지 — 오류 화면은 status가 error 그대로라 이걸로만 진행을 알린다 */
  isFetching: boolean
  /** 다음 페이지가 남았는지 — 붙은 페이지가 비어도 sentinel을 남겨야 이어 부를 수 있다 */
  hasNextPage: boolean
  /** 다음 페이지 요청만 실패했는지 — 목록은 두고 하단만 재시도 줄로 바꾼다 */
  isFetchNextPageError: boolean
  onRetry: () => void
  onRetryNextPage: () => void
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
  isFetching,
  hasNextPage,
  isFetchNextPageError,
  onRetry,
  onRetryNextPage,
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
        actionLoading={isFetching}
        onRetry={onRetry}
      />
    )
  }
  // 다음 페이지가 남아 있으면 비어 있어도 빈 상태로 끝내지 않는다 —
  // sentinel까지 사라지면 남은 페이지를 부를 방법이 없어진다
  if (isEmpty && !hasNextPage) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-title-18md text-text-secondary">
        {emptyMessage}
      </p>
    )
  }
  return (
    <>
      {/* 붙은 페이지가 전부 비었을 뿐 다음 페이지는 남았다 — 자리를 비우지 않고 골격으로 채운다 */}
      {isEmpty && <RecordListSkeleton />}
      <ul className="flex flex-col gap-2">{children}</ul>
      {isFetchNextPageError ? (
        <RetryMessage message="더 불러오지 못했어요." onRetry={onRetryNextPage} />
      ) : (
        // 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다
        <div ref={loadMoreRef} aria-hidden className="h-6 w-full shrink-0" />
      )}
    </>
  )
}
