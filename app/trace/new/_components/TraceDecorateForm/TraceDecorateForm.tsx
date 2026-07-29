'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { passageMutations } from '@/app/_global/_queries/passage.queries'

import type { EffectOption } from '../../_data/effect.constant'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import type { TextRange } from '../../_services/textRange.service'
import { EffectPicker } from '../EffectPicker/EffectPicker'
import { MergeDialog } from '../MergeDialog/MergeDialog'
import { TextRangeSelector } from '../TextRangeSelector/TextRangeSelector'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

export function TraceDecorateForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [range, setRange] = useState<TextRange | null>(null)
  const [message, setMessage] = useState('')
  const [candidate, setCandidate] = useState<{ passageId: number; quotedText: string } | null>(null)
  const similarCheck = useMutation(passageMutations.similarCheck())

  const goToOpinion = () => {
    router.push('/trace/new/opinion')
  }

  const handleNext = () => {
    if (!draft.book || draft.pageNumber === null) return
    similarCheck.mutate(
      {
        bookId: draft.book.bookId,
        pageNumber: draft.pageNumber,
        quotedText: draft.quotedText,
      },
      {
        onSuccess: (response) => {
          const first = response.data?.passages[0]
          if (first) {
            setCandidate({ passageId: first.passageId, quotedText: first.quotedText })
            return
          }
          goToOpinion()
        },
        // 유사 검사는 편의 기능이다. 실패해도 흔적 작성을 막지 않는다.
        onError: goToOpinion,
      },
    )
  }

  const handlePick = (option: EffectOption) => {
    if (!range) {
      setMessage('영역 선택 후 효과를 입력해주세요!')
      return
    }
    // EffectPicker가 disabled 항목의 클릭 자체를 막아 effectType이 null인 값은 여기 도달하지 않는다.
    // EffectOption.effectType 타입 자체는 여전히 `DraftEffectType | null`이므로, dispatch에 넘기기 전
    // 컴파일러가 non-null을 알 수 있도록 좁혀준다(as 캐스팅 없이).
    if (option.effectType === null) return
    dispatch({
      type: 'applyDecoration',
      decoration: { ...range, effectType: option.effectType, color: option.color },
    })
    setRange(null)
  }

  return (
    <div className="relative flex flex-1 flex-col bg-bg-dark">
      <div className="bg-bg-default">
        <TraceStepHeader step={2} title={'원하는 영역을 선택하고\n다양한 효과를 적용해보세요'} />
      </div>
      {/* 노트가 흰 영역과 어두운 영역에 걸쳐 놓인다 — 시안에서 노트 아래 199px가 어두운 배경이다 */}
      <div className="relative bg-bg-default px-8">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
        <div className="relative">
          <TraceNote quotedText={draft.quotedText} decorations={draft.decorations}>
            <div className="absolute inset-0 px-6 py-10">
              <TextRangeSelector text={draft.quotedText} onSelect={setRange} />
            </div>
          </TraceNote>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-4 py-6">
        <span className="text-body-16md text-text-inverse opacity-80">효과</span>
        <EffectPicker onPick={handlePick} disabled={false} />
      </div>

      <div
        className="mt-auto flex gap-2 p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          variant="back"
          className="h-[54px] flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="h-[54px] flex-1"
          disabled={draft.decorations.length === 0 || similarCheck.isPending}
          onClick={handleNext}
        >
          다음
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />

      <MergeDialog
        open={candidate !== null}
        myQuote={draft.quotedText}
        candidateQuote={candidate?.quotedText ?? ''}
        onMerge={() => {
          dispatch({ type: 'setMergeTarget', passageId: candidate?.passageId ?? null })
          goToOpinion()
        }}
        onSeparate={() => {
          dispatch({ type: 'setMergeTarget', passageId: null })
          goToOpinion()
        }}
      />
    </div>
  )
}
