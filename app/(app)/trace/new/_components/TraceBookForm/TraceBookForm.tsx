'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { BookSearchSheet } from '@/app/_shared/book/_components/BookSearchSheet/BookSearchSheet'
import { SelectedBookCard } from '@/app/_shared/book/_components/SelectedBookCard/SelectedBookCard'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { useTraceOverlay } from '../../_hooks/useTraceOverlay'
import { useTraceSubmit } from '../../_hooks/useTraceSubmit'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { TraceMergePrompt } from '../TraceMergePrompt/TraceMergePrompt'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceOpinionPreview } from '../TraceOpinionPreview/TraceOpinionPreview'
import { TraceStepIndicator } from '../TraceStepIndicator/TraceStepIndicator'

export function TraceBookForm() {
  const { draft, dispatch } = useTraceDraft()
  const { goBack } = useTraceNav()
  const { register } = useTraceOverlay()
  // 모임 안에서 남기는 흔적은 그 모임의 책에 고정이다 — 다른 책으로 보내면 서버가
  // GROUP_400_3으로 거절한다. 고를 수 없는 것을 고르게 두지 않으려고 길 자체를 없앤다.
  const isBookLocked = draft.groupId !== null
  // 씨앗으로 책이 이미 있으면(책 상세에서 들어온 경우) 시트를 다시 열 이유가 없다 — 바로 확인 화면이다.
  const [sheetOpen, setSheetOpen] = useState(draft.book === null && draft.groupId === null)
  // 저장은 ①(대목을 물고 들어온 경로)과도 나눠 쓴다 — useTraceSubmit이 그 한 벌이다.
  const { closeMessage, isSaving, message, save } = useTraceSubmit()
  // 비로그인이면 401이라 me가 비어 있다 — BookSearchView의 처리와 같게 '나'로 떨어뜨린다.
  const me = useQuery(userQueries.me())
  const nickname = me.data?.data?.nickname ?? '나'

  // 검색 시트가 떠 있는 동안에는 뒤로가기가 플로우를 나가는 대신 시트만 닫는다.
  // 가드가 없으면 이탈 확인 다이얼로그가 시트 위에 겹쳐 뜬다(BookSearchSheet의 가드는
  // 시트 안쪽 도서 추가 폼만 덮는다).
  useOverlayBackGuard(sheetOpen, () => {
    setSheetOpen(false)
  })

  const handleSelectBook = (book: SelectedBook) => {
    // 책이 달라지면 유사 대목을 묻는 키(책 + 대목)도 달라진다 — TraceMergePrompt가 새 책으로 다시 묻는다.
    dispatch({ type: 'selectBook', book })
    setSheetOpen(false)
  }

  // min-h-0이 없으면 flex 아이템의 min-height:auto 때문에 셸(h-dvh)보다 커져도 줄지 않는다
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-dark">
      {/* 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다.
          시안은 이 화면도 write/decorate와 같은 밝음/어둠 구성이다 —
          책 카드까지 흰 영역에 넣는다(TraceWriteForm·TraceDecorateForm과 같은 처리). */}
      <div className="-mt-(--safe-top) bg-bg-default pt-(--safe-top)">
        <TraceStepIndicator current={3} />
      </div>

      {/* 셸이 h-dvh·overflow-hidden이라 넘치는 만큼이 잘린다. 노트(320px)와 책 카드가 고정
          높이라 의견이 조금만 길어도 '기록 완료'가 화면 밖으로 밀려 저장 자체가 막혔다 —
          가운데만 스크롤시키고 단계 표시와 버튼 줄은 바깥에 두어 고정한다. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-bg-default px-4 pt-2 pb-6">
          <SelectedBookCard
            book={draft.book}
            onEdit={
              isBookLocked
                ? undefined
                : () => {
                    setSheetOpen(true)
                  }
            }
          />
        </div>

        {/* 노트가 흰 영역과 어두운 영역에 걸쳐 놓인다 — 시안에서 노트 아래 199px가 어두운
            배경이다(TraceWriteForm·TraceDecorateForm과 같은 처리). */}
        <div className="relative bg-bg-default px-8">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
          <div className="relative">
            <TraceNote quotedText={draft.quotedText} decorations={draft.decorations} />
          </div>
        </div>

        <div className="pt-6 pb-4">
          <TraceOpinionPreview content={draft.content} nickname={nickname} />
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-safe">
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
          disabled={!draft.book}
          loading={isSaving}
          onClick={save}
        >
          기록 완료
        </Button>
      </div>

      {!isBookLocked && (
        <BookSearchSheet
          open={sheetOpen}
          onClose={() => {
            setSheetOpen(false)
          }}
          onRegisterBack={register}
          onSelect={handleSelectBook}
        />
      )}

      {/* 책을 여기서 처음 고른 경로(책 없이 시작한 흔적)는 이 자리에서야 '책 + 대목'이 갖춰진다 */}
      <TraceMergePrompt at="book" />

      <Snackbar message={message} onClose={closeMessage} />
    </div>
  )
}
