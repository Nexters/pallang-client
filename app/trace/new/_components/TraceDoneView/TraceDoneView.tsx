'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'

export function TraceDoneView() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const { goTo } = useTraceNav()

  return (
    <div className="flex flex-1 flex-col bg-bg-overlay">
      <div className="flex flex-1 items-end justify-center pb-6">
        {draft.book?.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
          <img
            src={draft.book.coverImageUrl}
            alt={draft.book.title}
            className="h-52 w-36 rounded-[2px] object-cover"
          />
        ) : (
          <span className="h-52 w-36 rounded-[2px] bg-bg-gray" />
        )}
      </div>

      <div
        className="flex flex-col items-center gap-2 rounded-t-[28px] bg-bg-default px-4 pt-8 pb-4"
        style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}
      >
        <h1 className="text-title-20sb text-text-primary">흔적을 책에 끼워두었어요!</h1>
        <p className="text-center text-body-14md text-text-tertiary">
          또 남기고 싶은 문장이 있다면
          <br />
          아래 버튼을 눌러 더 남겨보세요.
        </p>
        <div className="mt-6 flex w-full gap-2">
          <Button
            variant="back"
            className="flex-1"
            onClick={() => {
              // 홈으로 나가도 초안을 비운다. 남겨두면 다시 들어왔을 때 완료 화면으로 튕긴다.
              dispatch({ type: 'reset' })
              router.replace('/')
            }}
          >
            뒤로
          </Button>
          <Button
            variant="activated"
            className="flex-1"
            onClick={() => {
              dispatch({ type: 'resetKeepingBook' })
              goTo('search')
            }}
          >
            흔적 남기기
          </Button>
        </div>
      </div>
    </div>
  )
}
