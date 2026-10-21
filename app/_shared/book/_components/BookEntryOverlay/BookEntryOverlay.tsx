'use client'

import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

import type { BookEntryOverlayState } from '../../_hooks/useBookEntry'
import { GroupPickSheet } from '../GroupPickSheet/GroupPickSheet'
import { PrivateGroupBookDialog } from '../PrivateGroupBookDialog/PrivateGroupBookDialog'

type BookEntryOverlayProps = {
  overlay: BookEntryOverlayState | null
  onClose: () => void
  /** 시트에서 모임을 골라 떠나기 직전에 할 일 — useBookEntry에 준 것과 같은 값을 넘긴다 */
  onLeave?: () => void
}

/** useBookEntry가 바로 이동하지 못한 책에 띄우는 두 가지 — 내 모임 고르기 시트와 비공개 모임 안내 모달 */
export function BookEntryOverlay({ overlay, onClose, onLeave }: BookEntryOverlayProps) {
  // 닫히는 동안(퇴장 전환) 내용이 비지 않게 마지막 값을 붙잡아 둔다
  const pick = useLastPresent(overlay?.kind === 'pickGroup' ? overlay : null)
  const privateBook = useLastPresent(overlay?.kind === 'privateGroup' ? overlay.book : null)

  return (
    <>
      <GroupPickSheet
        open={overlay?.kind === 'pickGroup'}
        bookId={pick?.book.bookId ?? null}
        groups={pick?.groups ?? []}
        onClose={onClose}
        onLeave={onLeave}
      />
      <PrivateGroupBookDialog
        open={overlay?.kind === 'privateGroup'}
        book={privateBook}
        onClose={onClose}
      />
    </>
  )
}
