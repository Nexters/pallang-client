'use client'

import type { MyPassage } from '@/app/_global/_queries/user.queries'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'
import { RecordCard } from '@/app/_shared/user/_components/RecordCard/RecordCard'
import { formatRecordedDate } from '@/app/_shared/user/_services/recordDate.service'

type SpoilerPassageCardProps = {
  passage: MyPassage
  /** `해제`를 눌렀을 때 — 확인 다이얼로그는 목록 쪽이 하나만 들고 있는다 */
  onRelease: (passage: MyPassage) => void
}

/**
 * 스포일러 관리 목록의 카드 하나.
 * 틀은 `RecordCard`가 갖고, 여기서는 스포일러에만 있는 것(작성일 머리줄·`해제` 버튼)을 채운다.
 */
export function SpoilerPassageCard({ passage, onRelease }: SpoilerPassageCardProps) {
  return (
    <RecordCard
      pageNumber={passage.pageNumber}
      meta={formatRecordedDate(passage.createdAt)}
      // 대목 응답에는 흔적 본문이 없다 — 스포일러로 가려 둔 인용문 자체가 이 화면의 본문이다
      body={passage.quotedText}
      link={{
        href: buildTraceTargetHref(passage.bookId, {
          pageNumber: passage.pageNumber,
          passageId: passage.passageId,
          opinionId: passage.opinionId,
        }),
        label: `${String(passage.pageNumber)}쪽 흔적 보기`,
      }}
      action={
        <button
          type="button"
          aria-label={`${String(passage.pageNumber)}쪽 스포일러 해제`}
          onClick={() => {
            onRelease(passage)
          }}
          // 시안의 알약 버튼 — 흰 바탕에 10% 테두리, 12px Bold
          className="flex h-6 items-center justify-center rounded-full border border-border-default bg-bg-default px-3 text-title-12bd text-text-tertiary press"
        >
          해제
        </button>
      }
    />
  )
}
