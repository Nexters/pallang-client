'use client'

import { type PointerEvent, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { DEFAULT_DECORATION_COLOR } from '@/app/_shared/trace/_data/decorationColor.constant'

import type { EffectOption } from '../../_data/effect.constant'
import { TRACE_NOTE_SIZE } from '../../_data/traceNote.constant'
import { useTextRangeSelection } from '../../_hooks/useTextRangeSelection'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import type { TextRange } from '../../_services/textRange.service'
import type { DraftDecoration } from '../../_types/traceDraft.type'
import { DecorationEditPopover } from '../DecorationEditPopover/DecorationEditPopover'
import { EffectPicker } from '../EffectPicker/EffectPicker'
import { TraceBookHeader } from '../TraceBookHeader/TraceBookHeader'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepIndicator } from '../TraceStepIndicator/TraceStepIndicator'

// 시안의 토스트는 앞머리만 오렌지 볼드로 둔다 — 둘을 붙여 써 어긋나지 않게 한다.
const EFFECT_HINT = '효과를 먼저 선택'
const EFFECT_HINT_MESSAGE = `${EFFECT_HINT}한 뒤 문장을 드래그해주세요!`

export function TraceDecorateForm() {
  const { draft, dispatch } = useTraceDraft()
  const { goBack, goTo } = useTraceNav()
  const [range, setRange] = useState<TextRange | null>(null)
  const [message, setMessage] = useState('')
  const [activeEffect, setActiveEffect] = useState<EffectOption | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState<{
    decoration: DraftDecoration
    left: number
    top: number
  } | null>(null)
  // 닫히는 동안 좌표·색이 남아 있어야 팝오버가 제자리에서 줄어들며 사라진다
  const shownEditing = useLastPresent(editing)
  const popover = useExitTransition(editing !== null, MOTION_DURATION.fast)

  // 손을 뗀 시점에 골라 둔 효과를 적용한다. 효과를 고르지 않았으면 힌트만 보여준다.
  const handleCommit = (committed: TextRange) => {
    if (!activeEffect) {
      setRange(null)
      setMessage(EFFECT_HINT_MESSAGE)
      return
    }
    dispatch({
      type: 'applyDecoration',
      decoration: {
        ...committed,
        effectType: activeEffect.effectType,
        color: DEFAULT_DECORATION_COLOR,
      },
    })
    setRange(null)
  }

  const { handlers } = useTextRangeSelection({
    onChange: setRange,
    onCommit: handleCommit,
    scrollRef,
  })

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

  // 효과를 고르는 동작이다 — 적용은 드래그를 마칠 때 handleCommit이 담당한다.
  const handlePick = (option: EffectOption) => {
    setActiveEffect(option)
  }

  // min-h-0이 없으면 flex 아이템의 min-height:auto 때문에 셸(h-dvh)보다 커져도 줄지 않는다
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-dark">
      {/* 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다 */}
      <div className="-mt-(--safe-top) bg-bg-default pt-(--safe-top)">
        <TraceStepIndicator current={2} />
        <TraceBookHeader />
      </div>
      {/* 셸이 h-dvh·overflow-hidden이라 넘치는 만큼이 잘린다 — 가운데만 스크롤시키고
          단계 표시와 버튼 줄은 바깥에 두어 고정한다(①·③과 같은 처리). */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 노트가 밝음/어둠 경계를 가로지른다 — 어두운 쪽 높이는 노트 높이와 한 쌍이다 */}
        <div className="relative bg-bg-default px-8">
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 bg-bg-dark ${TRACE_NOTE_SIZE.compact.dark}`}
          />
          <div ref={noteRef} className="relative">
            <TraceNote
              size="compact"
              quotedText={draft.quotedText}
              decorations={draft.decorations}
              pendingRange={range}
              selectable
              scrollRef={scrollRef}
              {...handlers}
              onPointerDown={handlePointerDown}
            />
            {popover.shouldRender && shownEditing && (
              <DecorationEditPopover
                color={shownEditing.decoration.color}
                left={shownEditing.left}
                top={shownEditing.top}
                state={popover.state}
                onClose={() => {
                  setEditing(null)
                }}
                onRecolor={(color) => {
                  dispatch({
                    type: 'recolorDecoration',
                    startOffset: shownEditing.decoration.startOffset,
                    color,
                  })
                  setEditing({ ...shownEditing, decoration: { ...shownEditing.decoration, color } })
                }}
                onRemove={() => {
                  dispatch({
                    type: 'removeDecoration',
                    startOffset: shownEditing.decoration.startOffset,
                  })
                  setEditing(null)
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-6">
          {/* 시안(3082:36364)에서 안내 문구가 흰 상단이 아니라 효과 목록 바로 위로 내려왔다 —
              고를 것과 안내가 붙어 있어야 "골라서 문장에 칠한다"가 한 덩이로 읽힌다 */}
          <h1 className="whitespace-pre-line text-title-16sb text-text-inverse">
            {'원하는 효과를 선택하고\n문장에 표시해보세요'}
          </h1>
          <EffectPicker onPick={handlePick} disabled={false} selectedKey={activeEffect?.key} />
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-4 pb-safe">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            goBack()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={draft.decorations.length === 0}
          onClick={() => {
            goTo('book')
          }}
        >
          다음
        </Button>
      </div>

      <Snackbar
        message={message}
        highlight={EFFECT_HINT}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
