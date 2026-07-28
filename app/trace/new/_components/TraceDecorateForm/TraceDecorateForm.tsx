'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

import type { EffectOption } from '../../_data/effect.constant'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import type { TextRange } from '../../_services/textRange.service'
import { EffectPicker } from '../EffectPicker/EffectPicker'
import { TextRangeSelector } from '../TextRangeSelector/TextRangeSelector'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

export function TraceDecorateForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [range, setRange] = useState<TextRange | null>(null)
  const [message, setMessage] = useState('')

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
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader step={2} title={'원하는 영역을 선택하고\n다양한 효과를 적용해보세요'} />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={draft.decorations}>
          <div className="absolute inset-0 px-6 py-8">
            <TextRangeSelector text={draft.quotedText} onSelect={setRange} />
          </div>
        </TraceNote>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-8">
        <span className="text-body-14md text-text-inverse">효과</span>
        <EffectPicker onPick={handlePick} disabled={false} />
      </div>

      <div className="mt-auto flex gap-2 px-4 pb-4">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={draft.decorations.length === 0}
          onClick={() => {
            router.push('/trace/new/opinion')
          }}
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
    </div>
  )
}
