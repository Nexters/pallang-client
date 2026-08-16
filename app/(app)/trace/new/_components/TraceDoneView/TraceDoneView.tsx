'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'

import { useTraceDraft } from '../../_hooks/useTraceDraft'

export function TraceDoneView() {
  const router = useRouter()
  const { draft } = useTraceDraft()
  const bookId = draft.book?.bookId

  /**
   * 방금 남긴 흔적이 열린 채로 보이는 자리. 책만 찍어 보내면 책의 첫 쪽에 떨어져
   * 사용자가 자기 흔적을 직접 찾아가야 한다.
   * 좌표는 쪽·대목·흔적 셋이 다 있어야 성립하므로, 쪽 번호를 모르면 책 화면으로만 보낸다.
   */
  const traceHref = () => {
    if (bookId === undefined) return '/'
    const { result, pageNumber } = draft
    if (!result || pageNumber === null) return `/trace/${String(bookId)}`
    return buildTraceTargetHref(bookId, {
      pageNumber,
      passageId: result.passageId,
      opinionId: result.opinionId,
    })
  }

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

      <div className="flex flex-col items-center gap-2 rounded-t-[28px] bg-bg-default px-4 pt-8 pb-safe">
        <h1 className="text-title-20sb text-text-primary">흔적을 책에 끼워두었어요!</h1>
        <p className="text-center text-body-14md text-text-tertiary">
          남긴 흔적이 어떻게 보이는지
          <br />
          아래 버튼을 눌러 확인해 보세요.
        </p>
        <div className="mt-6 flex w-full gap-2">
          <Button
            variant="back"
            className="flex-1"
            onClick={() => {
              router.replace('/')
            }}
          >
            뒤로
          </Button>
          <Button
            variant="activated"
            className="flex-1"
            onClick={() => {
              router.replace(traceHref())
            }}
          >
            흔적 확인하러 가기
          </Button>
        </div>
      </div>
    </div>
  )
}
