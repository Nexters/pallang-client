'use client'

import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'

type ManualQuoteFormProps = {
  onSubmit: (quotedText: string) => void
}

/**
 * 대목을 손으로 적는 본문. 시트 껍데기를 갖지 않는 이유는 두 지면이 이 폼을 다르게 담기
 * 때문이다 — OCR 화면은 독립 시트(ManualQuoteSheet)로 띄우고, 방식 선택 화면은 자기 시트
 * 안에서 화면만 갈아 끼운다.
 */
export function ManualQuoteForm({ onSubmit }: ManualQuoteFormProps) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()

  return (
    <>
      <Textarea
        value={value}
        maxLength={150}
        placeholder="문장을 입력해주세요."
        onChange={(event) => {
          setValue(event.target.value)
        }}
      />
      <Button
        variant="activated"
        disabled={trimmed.length === 0}
        onClick={() => {
          onSubmit(trimmed)
        }}
      >
        다음
      </Button>
    </>
  )
}
