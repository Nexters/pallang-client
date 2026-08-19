'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

import { ManualQuoteForm } from '../ManualQuoteForm/ManualQuoteForm'

type ManualQuoteSheetProps = {
  open: boolean
  onClose: () => void
  onSubmit: (quotedText: string) => void
}

/** 대목을 손으로 적는 시트. OCR 화면처럼 이 폼만 단독으로 띄우는 지면이 쓴다. */
export function ManualQuoteSheet({ open, onClose, onSubmit }: ManualQuoteSheetProps) {
  return (
    <BottomSheet open={open} title="직접 입력" onClose={onClose}>
      <ManualQuoteForm onSubmit={onSubmit} />
    </BottomSheet>
  )
}
