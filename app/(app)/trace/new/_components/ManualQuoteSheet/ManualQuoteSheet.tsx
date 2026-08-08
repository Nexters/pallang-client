'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'

type ManualQuoteSheetProps = {
  open: boolean
  onClose: () => void
  onSubmit: (quotedText: string) => void
}

export function ManualQuoteSheet({ open, onClose, onSubmit }: ManualQuoteSheetProps) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()

  return (
    <BottomSheet open={open} title="직접 입력" onClose={onClose}>
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
    </BottomSheet>
  )
}
