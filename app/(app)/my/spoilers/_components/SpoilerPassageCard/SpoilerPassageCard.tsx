'use client'

import type { MyPassage } from '@/app/_global/_queries/user.queries'
import { RecordCard } from '@/app/_shared/user/_components/RecordCard/RecordCard'

// ponytail: 서버가 ISO 문자열을 주므로 필요한 자리만 잘라 쓴다 — 시안(225:12688)의 `26.08.10`은 두 자리 연도다
function formatRecordedDate(createdAt: string): string {
  return createdAt.slice(2, 10).replaceAll('-', '.')
}

type SpoilerPassageCardProps = {
  passage: MyPassage
  /** `해제`를 눌렀을 때 — 확인 다이얼로그는 목록 쪽이 하나만 들고 있는다 */
  onRelease: (passage: MyPassage) => void
}

/**
 * 스포일러 관리 목록의 카드 하나(Figma 225:12682).
 * 틀은 `RecordCard`가 갖고, 여기서는 스포일러에만 있는 것(작성일 머리줄·`해제` 버튼)을 채운다.
 */
export function SpoilerPassageCard({ passage, onRelease }: SpoilerPassageCardProps) {
  return (
    <RecordCard
      pageNumber={passage.pageNumber}
      meta={formatRecordedDate(passage.createdAt)}
      // 대목 응답에는 흔적 본문이 없다 — 스포일러로 가려 둔 인용문 자체가 이 화면의 본문이다
      body={passage.quotedText}
      // 흔적 좌표는 opinionId까지 있어야 성립하는데 대목 목록에는 없어 이동 링크를 걸지 않는다
      action={
        <button
          type="button"
          aria-label={`${String(passage.pageNumber)}쪽 스포일러 해제`}
          onClick={() => {
            onRelease(passage)
          }}
          // 시안(225:12690)의 알약 버튼 — 흰 바탕에 10% 테두리, 12px Bold
          className="flex h-6 items-center justify-center rounded-full border border-border-default bg-bg-default px-3 text-title-12bd text-text-tertiary press"
        >
          해제
        </button>
      }
    />
  )
}
