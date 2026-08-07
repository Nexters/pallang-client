'use client'

import { Button } from '@/app/_global/_components/Button/Button'
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
    // 두 선택지 중 하나를 반드시 골라야 한다. open만 제어하고 onOpenChange를 주지 않으므로
    // 백드롭 클릭·Esc로는 상태가 바뀌지 않는다(바깥 클릭 닫힘은 base-ui 기본값도 off).
    <Dialog.Root open={open}>
      <Dialog.Content>
        <Dialog.Illustration />
        <Dialog.Header>
          <Dialog.Title>{'기존 문장과 유사해요.\n의견을 하나로 모을까요?'}</Dialog.Title>
        </Dialog.Header>
        <div className="flex w-full flex-col gap-4">
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
        <Dialog.Footer>
          <Button variant="back" onClick={onSeparate}>
            따로 남길게요
          </Button>
          <Button variant="activated" onClick={onMerge}>
            합칠게요
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
