import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'

type MeetingEmptyStateProps = {
  onCreate: () => void
}

/**
 * 시안 3308:23163 — 일러스트 240×173(불투명), 제목 24, 부제 18, 버튼 168×54.
 * FeedbackState를 쓰지 않는 이유: 거기는 일러스트가 40% 투명이고 제목·부제 두 단 구성이 아니다.
 */
export function MeetingEmptyState({ onCreate }: MeetingEmptyStateProps) {
  return (
    <section
      aria-label="빈 모임 목록"
      className="flex flex-1 flex-col items-center justify-center gap-2 pb-6"
    >
      <Image src="/images/mascot-pair.png" alt="" width={240} height={173} priority />
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-title-24bd text-text-secondary">아직 참여 중인 모임이 없어요!</h2>
          <p className="text-title-18md whitespace-pre-line text-text-tertiary">
            {'친구 또는 지인과 함께\n교환독서를 할 모임을 만들어보세요'}
          </p>
        </div>
        <Button className="h-[54px] w-42" onClick={onCreate}>
          모임 만들기
        </Button>
      </div>
    </section>
  )
}
