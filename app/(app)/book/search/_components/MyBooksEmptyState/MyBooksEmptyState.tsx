import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'

const MASCOT_SRC = '/images/mascot-pair.png'

type MyBooksEmptyStateProps = {
  onCreateTrace: () => void
  onExplore: () => void
}

export function MyBooksEmptyState({ onCreateTrace, onExplore }: MyBooksEmptyStateProps) {
  return (
    <section
      aria-label="빈 내 서재 검색"
      className="flex flex-1 flex-col items-center gap-8 px-4 pt-[110px] pb-10"
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src={MASCOT_SRC}
          alt=""
          width={175}
          height={126}
          aria-hidden="true"
          className="h-auto w-[175px] opacity-40"
        />
        <p className="text-center text-title-18md text-text-secondary">
          아직 남긴 기록이 없어요!
          <br />
          탐색에서 다른 사람의 기록을 둘러보거나
          <br />
          직접 기록을 남겨보세요!
        </p>
      </div>
      <div className="flex w-full gap-2">
        <Button className="h-[54px] min-w-0 flex-1" onClick={onExplore}>
          탐색으로 이동
        </Button>
        <Button variant="activated" className="h-[54px] min-w-0 flex-1" onClick={onCreateTrace}>
          기록 남기러가기
        </Button>
      </div>
    </section>
  )
}
