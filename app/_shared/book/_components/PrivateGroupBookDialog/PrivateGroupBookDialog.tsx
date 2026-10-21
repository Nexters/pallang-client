'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { buildMeetingCreateHref } from '@/app/_shared/meeting/_data/meetingCreateSeed.model'
import { buildTraceSeedHref } from '@/app/_shared/trace/_data/traceSeed.model'

import type { BookEntryBook } from '../../_data/bookEntry.model'

type PrivateGroupBookDialogProps = {
  open: boolean
  /** 닫히는 동안에도 문구가 비지 않게 마지막 책을 넘겨받는다(useLastPresent) */
  book: BookEntryBook | null
  onClose: () => void
}

/**
 * 시안 4021:15674 — 공개 기록도 내 모임도 없이 남의 비공개 모임에서만 읽는 책을 눌렀을 때의 안내.
 * 카드는 Dialog와 같은 스펙(343, r32, 버튼 54)이고 자리만 화면 아래다(시안의 '신규 모달' 두 장이 모두 아래 정렬).
 */
export function PrivateGroupBookDialog({ open, book, onClose }: PrivateGroupBookDialogProps) {
  const router = useRouter()
  const runWithLogin = useLoginGate()

  // 로그인 게이트도 다이얼로그라 이 모달을 먼저 닫고 띄운다 — 두 장이 겹쳐 뜨지 않게
  const createMeeting = () => {
    if (!book) return
    onClose()
    runWithLogin(() => {
      router.push(buildMeetingCreateHref(book.bookId))
    }, LOGIN_GATE_MESSAGE.groupCreate)
  }

  const writePublicTrace = () => {
    if (!book) return
    onClose()
    runWithLogin(() => {
      router.push(
        buildTraceSeedHref({
          bookId: book.bookId,
          bookTitle: book.title,
          bookCoverImageUrl: book.coverImageUrl ?? null,
          passage: null,
          groupId: null,
        }),
      )
    }, LOGIN_GATE_MESSAGE.traceCreate)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop />
        {/* 하단 인셋은 셸이 소비하지 않는다 — 홈 인디케이터에 카드가 붙지 않게 직접 더한다 */}
        <Dialog.Viewport className="items-end pb-[max(8px,var(--safe-bottom))]">
          <Dialog.Popup illustrated={false}>
            <Dialog.Header>
              <Dialog.Title>이 책은 비공개 모임에서 읽고 있어요</Dialog.Title>
              <Dialog.Description>
                {
                  '이 책에 남겨진 글은 해당 모임 멤버만 볼 수 있어요.\n누구나 볼 수 있도록 나의 생각을 남기거나,\n새 비공개 모임을 만들어 지인들과 함께 읽어보세요.'
                }
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Button variant="back" className="h-[54px]" onClick={createMeeting}>
                새 모임 개설하기
              </Button>
              <Button variant="activated" className="h-[54px]" onClick={writePublicTrace}>
                공개로 의견 남기기
              </Button>
            </Dialog.Footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
