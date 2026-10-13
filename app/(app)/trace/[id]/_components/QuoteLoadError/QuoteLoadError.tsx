import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'
import {
  FEEDBACK_ILLUSTRATION_SIZE,
  FEEDBACK_ILLUSTRATION_SRC,
} from '@/app/_global/_data/feedbackIllustration.constant'

/** 대목을 불러오지 못했을 때 포스트잇 카드 안을 대신 채우는 화면(시안 229:24303).
    같은 실패에서 아래 목록도 비므로 TraceListError가 함께 뜬다 — 대목이 깨지면
    passageId가 없어 의견도 부를 수 없기 때문이다. 재시도는 두 화면이 같은 핸들러를 쓴다.

    화면 가운데 서는 공용 FeedbackState와 문구·구성은 같지만, 여기서는 300×310 카드 안에
    들어가야 해서 일러스트가 한 단계 작다(140×112) — 공용 컴포넌트에 크기 prop을 내는 대신
    이 화면만의 치수로 따로 세운다. */
export function QuoteLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Image
          src={FEEDBACK_ILLUSTRATION_SRC}
          alt=""
          {...FEEDBACK_ILLUSTRATION_SIZE}
          aria-hidden="true"
          className="h-[112px] w-[140px] object-bottom opacity-40"
        />
        <p className="text-center font-pretendard text-body-20md text-text-secondary">
          문장을 불러오지 못했어요.
          <br />
          다시 시도해주세요.
        </p>
      </div>
      {/* 54×167은 시안의 고정 치수 — 목록 쪽 재시도 버튼(TraceListError)과 같은 크기다 */}
      <Button className="h-[54px] w-[167px] shrink-0" onClick={onRetry}>
        다시 시도하기
      </Button>
    </div>
  )
}
