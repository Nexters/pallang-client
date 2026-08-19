'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'
import { cn } from '@/app/_global/_services/cn.service'
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

      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-t-[28px] bg-bg-default px-4 pt-8 pb-safe',
          // 이 판은 바텀시트처럼 생겼지만 다이얼로그가 아니라 화면의 일부다 — 그래도 등장은
          // 시트와 같아야 해서 같은 토큰을 쓴다. 화면에 들어서는 순간 한 번만 올라오면 되므로
          // @starting-style로 시작값만 준다(translate는 레이아웃을 밀지 않아 자리도 그대로다).
          // 시작값은 직접 값으로 낸다 — translate-* 유틸은 var로 조립돼 iOS Safari가
          // @starting-style 안에서 시작값을 잡지 못한다(motionConvention.spec.ts가 막는다).
          'transition-transform duration-rise ease-rise starting:[translate:0_100%]',
        )}
      >
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
