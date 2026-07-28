'use client'

import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

type MergeDialogProps = {
  open: boolean
  myQuote: string
  candidateQuote: string
  onMerge: () => void
  onSeparate: () => void
}

export function MergeDialog({
  open,
  myQuote,
  candidateQuote,
  onMerge,
  onSeparate,
}: MergeDialogProps) {
  return (
    <Dialog open={open} title={'기존 문장과 유사해요.\n의견을 하나로 모을까요?'}>
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-body-14md text-text-secondary">내가 발췌한 문장</h3>
          <p className="rounded-lg bg-bg-surface p-4 text-body-14rg text-text-secondary">
            {myQuote}
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-body-14md text-text-secondary">비슷한 문장</h3>
          <p className="rounded-lg bg-bg-surface p-4 text-body-14rg text-text-secondary">
            {candidateQuote}
          </p>
        </section>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onMerge}
          className="rounded-2xl bg-interactive-accent py-4 text-body-16bd text-text-inverse"
        >
          합칠게요
        </button>
        <button
          type="button"
          onClick={onSeparate}
          className="rounded-2xl bg-interactive-btn-primary py-4 text-body-16bd text-text-inverse"
        >
          따로 남길게요
        </button>
      </div>
    </Dialog>
  )
}
