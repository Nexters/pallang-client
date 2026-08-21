'use client'

import { useAppBack } from '@/app/_global/_hooks/useAppBack'
import type { TraceSeedPassage } from '@/app/_shared/trace/_data/traceSeed.model'

import { useOpinionSubmit } from '../../_hooks/useOpinionSubmit'
import { CommentBar } from '../CommentBar/CommentBar'

type OpinionComposerProps = {
  bookId: number
  activePassage: Omit<TraceSeedPassage, 'pageNumber'> | undefined
  pageNumber: number
  groupId?: number
  onClose: () => void
}

/**
 * 흔적 화면 하단에 그 자리에서 의견을 남기는 입력바(#368) — 댓글 입력바(CommentBar)와
 * 같은 생김새·계약으로, '의견 남기기'가 작성 플로우로 떠나던 길을 대신한다.
 *
 * 등록이 실제로 끝났을 때만 닫는다 — 실패하면 입력을 남긴 채 바가 그대로 있어 다시 시도할 수 있다.
 * 바깥(투명 백드롭) 탭과 하드웨어 뒤로가기는 등록 없이 바만 접는다.
 */
export function OpinionComposer({
  bookId,
  activePassage,
  pageNumber,
  groupId,
  onClose,
}: OpinionComposerProps) {
  const submit = useOpinionSubmit({ bookId, activePassage, pageNumber, groupId })

  // 뒤로가기(하드웨어/제스처)가 화면을 나가는 대신 입력바만 접는다 — 마운트 동안만 최상단에 선다
  useAppBack(onClose)

  return (
    <>
      {/* 시각적으론 투명하지만 바깥 탭 = 닫기를 만든다 — 시트의 백드롭과 같은 역할이다 */}
      <button
        type="button"
        aria-label="의견 입력 닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="absolute inset-x-0 bottom-0">
        <CommentBar
          // 남기려고 연 자리다 — 열리는 즉시 키보드가 서야 한 번 더 누르지 않는다(#374)
          autoFocus
          placeholder="의견을 입력해주세요"
          submitLabel="의견 등록"
          onSubmit={async (content) => {
            const isSubmitted = await submit(content)
            // 목록에 새 의견이 보이는 시점에 바가 접힌다 — 등록됐는데 바가 남아 두 번 쓰게 두지 않는다
            if (isSubmitted) onClose()
            return isSubmitted
          }}
        />
      </div>
    </>
  )
}
