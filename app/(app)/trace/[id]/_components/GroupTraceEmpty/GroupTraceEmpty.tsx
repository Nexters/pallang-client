import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'
import {
  FEEDBACK_ILLUSTRATION_SIZE,
  FEEDBACK_ILLUSTRATION_SRC,
} from '@/app/_global/_data/feedbackIllustration.constant'

/** 모임 스코프에서 아직 남긴 대목이 없을 때 포스트잇 카드 안을 채우는 안내(시안 3556:29129).
    같은 자리에 서는 QuoteLoadError와 구성·치수가 한 벌(일러스트 140×112 · 버튼 54×167)이고,
    문구와 버튼의 행선지(기록 남기기 플로우)만 다르다. */
export function GroupTraceEmpty({ onCreate }: { onCreate: () => void }) {
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
          아직 모임에서 남긴 문장과
          <br />
          의견이 없어요!
        </p>
      </div>
      <Button className="h-[54px] w-[167px] shrink-0" onClick={onCreate}>
        바로 남기러 가기
      </Button>
    </div>
  )
}
