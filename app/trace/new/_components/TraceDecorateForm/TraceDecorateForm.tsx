'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { type PointerEvent, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { passageMutations } from '@/app/_global/_queries/passage.queries'

import { DEFAULT_DECORATION_COLOR } from '../../_data/decorationColor.constant'
import type { EffectOption } from '../../_data/effect.constant'
import { useTextRangeSelection } from '../../_hooks/useTextRangeSelection'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import type { TextRange } from '../../_services/textRange.service'
import type { DraftDecoration } from '../../_types/traceDraft.type'
import { DecorationEditPopover } from '../DecorationEditPopover/DecorationEditPopover'
import { EffectPicker } from '../EffectPicker/EffectPicker'
import { MergeDialog } from '../MergeDialog/MergeDialog'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

export function TraceDecorateForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [range, setRange] = useState<TextRange | null>(null)
  const [message, setMessage] = useState('')
  const [candidate, setCandidate] = useState<{ passageId: number; quotedText: string } | null>(null)
  const similarCheck = useMutation(passageMutations.similarCheck())
  const { handlers } = useTextRangeSelection(setRange)
  const noteRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState<{
    decoration: DraftDecoration
    left: number
    top: number
  } | null>(null)

  // 이미 효과가 들어간 자리를 누르면 새 범위를 잡는 대신 색·삭제 팝오버를 연다.
  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null
    const marked = target?.closest('[data-decoration-start]')
    const note = noteRef.current
    const startOffset = Number(marked?.getAttribute('data-decoration-start'))
    const decoration = draft.decorations.find((item) => item.startOffset === startOffset)

    if (marked && note && decoration) {
      const markedRect = marked.getBoundingClientRect()
      const noteRect = note.getBoundingClientRect()
      setRange(null)
      setEditing({
        decoration,
        // 팝오버 폭(218px)의 절반만큼은 노트 안쪽에 두어야 화면 밖으로 나가지 않는다
        left: Math.min(
          Math.max(markedRect.left + markedRect.width / 2 - noteRect.left, 109),
          noteRect.width - 109,
        ),
        top: markedRect.top - noteRect.top,
      })
      return
    }

    setEditing(null)
    handlers.onPointerDown(event)
  }

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
    dispatch({
      type: 'applyDecoration',
      decoration: { ...range, effectType: option.effectType, color: DEFAULT_DECORATION_COLOR },
    })
    setRange(null)
    setEditing(null)
  }

  return (
    <div className="relative flex flex-1 flex-col bg-bg-dark">
      <div className="bg-bg-default">
        <TraceStepHeader step={2} title={'원하는 영역을 선택하고\n다양한 효과를 적용해보세요'} />
      </div>
      {/* 노트가 흰 영역과 어두운 영역에 걸쳐 놓인다 — 시안에서 노트 아래 199px가 어두운 배경이다 */}
      <div className="relative bg-bg-default px-8">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
        <div ref={noteRef} className="relative">
          <TraceNote
            quotedText={draft.quotedText}
            decorations={draft.decorations}
            pendingRange={range}
            selectable
            {...handlers}
            onPointerDown={handlePointerDown}
          />
          {editing && (
            <DecorationEditPopover
              color={editing.decoration.color}
              left={editing.left}
              top={editing.top}
              onClose={() => {
                setEditing(null)
              }}
              onRecolor={(color) => {
                dispatch({
                  type: 'recolorDecoration',
                  startOffset: editing.decoration.startOffset,
                  color,
                })
                setEditing({ ...editing, decoration: { ...editing.decoration, color } })
              }}
              onRemove={() => {
                dispatch({ type: 'removeDecoration', startOffset: editing.decoration.startOffset })
                setEditing(null)
              }}
            />
          )}
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
