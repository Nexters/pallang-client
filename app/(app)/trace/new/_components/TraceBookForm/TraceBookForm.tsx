'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { opinionMutations } from '@/app/_global/_queries/opinion.queries'
import { passageMutations } from '@/app/_global/_queries/passage.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookSearchSheet } from '../BookSearchSheet/BookSearchSheet'
import { MergeDialog } from '../MergeDialog/MergeDialog'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceOpinionPreview } from '../TraceOpinionPreview/TraceOpinionPreview'
import { TraceStepIndicator } from '../TraceStepIndicator/TraceStepIndicator'

type MergeCandidate = { passageId: number; quotedText: string }

export function TraceBookForm() {
  const { draft, dispatch } = useTraceDraft()
  const { goBack, goTo } = useTraceNav()
  // 씨앗으로 책이 이미 있으면(책 상세에서 들어온 경우) 시트를 다시 열 이유가 없다 — 바로 확인 화면이다.
  const [sheetOpen, setSheetOpen] = useState(draft.book === null)
  const [candidate, setCandidate] = useState<MergeCandidate | null>(null)
  const [message, setMessage] = useState('')
  const { mutate: checkSimilar } = useMutation(passageMutations.similarCheck())
  const createOpinion = useMutation(opinionMutations.create())
  const runWithLogin = useLoginGate()
  // 비로그인이면 401이라 me가 비어 있다 — BookSearchView의 처리와 같게 '나'로 떨어뜨린다.
  const me = useQuery(userQueries.me())
  const nickname = me.data?.data?.nickname ?? '나'

  // 검색 시트가 떠 있는 동안에는 뒤로가기가 플로우를 나가는 대신 시트만 닫는다.
  // 가드가 없으면 이탈 확인 다이얼로그가 시트 위에 겹쳐 뜬다(BookSearchSheet의 가드는
  // 시트 안쪽 도서 추가 폼만 덮는다). 병합 다이얼로그보다 먼저 등록해야 둘이 겹칠 때
  // 나중에 등록된 안쪽 층부터 걷힌다.
  useOverlayBackGuard(sheetOpen, () => {
    setSheetOpen(false)
  })

  // 병합 다이얼로그가 떠 있는 동안에는 뒤로가기가 화면을 나가는 대신 다이얼로그만 닫는다.
  useOverlayBackGuard(candidate !== null, () => {
    setCandidate(null)
  })

  // 유사 대목 검사는 '책을 고르는 동작'이 아니라 '책 · 페이지 · 대목'이라는 조합에 매인다.
  // 선택 콜백에 매달아 두면 두 곳이 샌다 — 씨앗으로 책을 들고 들어와 시트를 한 번도 열지
  // 않는 경로(흔적 보기 → 흔적 남기기)에서는 아예 돌지 않고, ①로 돌아가 페이지만 바꿔도
  // 예전 판정이 그대로 남는다. 그래서 조합을 키로 삼아 effect에서 돌린다.
  const bookId = draft.book?.bookId ?? null
  const { pageNumber, passageId, quotedText } = draft
  const checkedKey = useRef<null | string>(null)

  useEffect(() => {
    if (bookId === null) return
    // 합칠 대목이 이미 정해져 있으면 물을 것이 없다(#228). 흔적 보기에서 대목을 물고 들어온
    // 경우가 그렇고(그 대목이 곧 합칠 대목이다), 이 화면의 다이얼로그에서 합치기를 고른 뒤
    // ①로 돌아가 페이지만 고친 경우도 같다 — 다시 물으면 방금 한 선택을 또 시킨다.
    if (passageId !== null) return
    // 같은 조합은 두 번 묻지 않는다 — 시트를 여닫거나 다시 렌더돼도 재요청이 없고,
    // 실패해도 키가 남아 재시도 루프가 생기지 않는다.
    const key = [bookId, pageNumber ?? 0, quotedText].join(':')
    if (checkedKey.current === key) return
    checkedKey.current = key

    checkSimilar(
      { bookId, pageNumber: pageNumber ?? 0, quotedText },
      {
        onSuccess: (response) => {
          const first = response.data?.passages[0]
          if (first) setCandidate({ passageId: first.passageId, quotedText: first.quotedText })
        },
        // 유사 검사는 편의 기능이다. 실패해도 등록을 막지 않는다.
        onError: () => {
          setCandidate(null)
        },
      },
    )
  }, [bookId, checkSimilar, pageNumber, passageId, quotedText])

  const handleSelectBook = (book: SelectedBook) => {
    // selectBook이 passageId를 비우므로 조합이 달라지고, 위 effect가 새 책으로 다시 묻는다.
    dispatch({ type: 'selectBook', book })
    setSheetOpen(false)
  }

  const handleSubmit = () => {
    if (!draft.book) return
    // 페이지 상한은 ①에서 볼 수 없다 — 책을 여기서 고르기 때문이다. 그래서 쪽수를 아는
    // 이 자리에서 막는다. 그냥 보내면 서버가 거절하고 "잠시 후 다시 시도" 안내가 뜨는데,
    // 다시 눌러도 계속 실패하고 무엇을 고쳐야 하는지도 알 수 없다.
    // 인기 목록 책은 쪽수를 모른다(pageCount가 null) — 그때는 검사를 건너뛴다.
    const maxPage = draft.book.pageCount
    if (draft.pageNumber !== null && maxPage !== null && draft.pageNumber > maxPage) {
      setMessage('페이지 번호가 이 책의 쪽수를 넘어요. 뒤로 가서 페이지를 확인해주세요.')
      return
    }
    createOpinion.mutate(
      {
        bookId: draft.book.bookId,
        pageNumber: draft.pageNumber ?? undefined,
        quotedText: draft.quotedText,
        isSpoiler: draft.isSpoiler,
        passageId: draft.passageId,
        content: draft.content,
        decorations: draft.decorations.map((decoration) => ({
          startOffset: decoration.startOffset,
          endOffset: decoration.endOffset,
          effectType: decoration.effectType,
          color: decoration.color,
        })),
      },
      {
        onSuccess: (response) => {
          if (!response.data) {
            setMessage('흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
            return
          }
          dispatch({
            type: 'setResult',
            result: { opinionId: response.data.opinionId, merged: response.data.merged },
          })
          goTo('done')
        },
        onError: (error) => {
          // draft는 그대로 둔다. 여기서 날리면 사용자가 입력한 전부가 사라진다.
          // 저장은 로그인이 필요하다. 일반 문구로 뭉개면 다시 눌러도 계속 실패한다.
          if (error instanceof ApiError && error.status === 401) {
            runWithLogin(() => {
              // 로그인 상태인데도 401이면 토큰이 만료된 것이다. 다시 시도하도록 알린다.
              setMessage('로그인 정보가 만료됐어요. 다시 시도해주세요.')
            }, LOGIN_GATE_MESSAGE.traceCreate)
            return
          }
          if (
            error instanceof ApiError &&
            (error.code === 'PASSAGE_400_2' || error.code === 'PASSAGE_404_1')
          ) {
            dispatch({ type: 'setMergeTarget', passageId: null })
            setMessage('합치려던 대목이 사라졌어요. 다시 시도해주세요.')
            return
          }
          setMessage('흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
        },
      },
    )
  }

  // min-h-0이 없으면 flex 아이템의 min-height:auto 때문에 셸(h-dvh)보다 커져도 줄지 않는다
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-dark">
      {/* 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다.
          시안(3092:14086)은 이 화면도 write/decorate와 같은 밝음/어둠 구성이다 —
          책 카드까지 흰 영역에 넣는다(TraceWriteForm·TraceDecorateForm과 같은 처리). */}
      <div className="-mt-(--safe-top) bg-bg-default pt-(--safe-top)">
        <TraceStepIndicator current={3} />
      </div>

      {/* 셸이 h-dvh·overflow-hidden이라 넘치는 만큼이 잘린다. 노트(320px)와 책 카드가 고정
          높이라 의견이 조금만 길어도 '기록 완료'가 화면 밖으로 밀려 저장 자체가 막혔다 —
          가운데만 스크롤시키고 단계 표시와 버튼 줄은 바깥에 두어 고정한다. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-bg-default px-4 pt-2 pb-6">
          <div className="flex items-start justify-between gap-3 rounded-lg bg-bg-surface p-3">
            {draft.book && (
              <BookItem
                // min-w-0이 없으면 BookItem이 최소 내용 너비 아래로 줄지 않아 '편집하기'를
                // 카드 밖으로 밀어낸다 — 셸이 가리던 것이 스크롤러가 생기며 가로 스크롤로 드러났다.
                className="min-w-0 flex-1"
                author={draft.book.author}
                coverImageUrl={draft.book.coverImageUrl}
                title={draft.book.title}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setSheetOpen(true)
              }}
              className="press shrink-0 cursor-pointer rounded-full border border-border-default px-3 py-1.5 text-body-14md text-text-secondary"
            >
              편집하기
            </button>
          </div>
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
          loading={createOpinion.isPending}
          onClick={handleSubmit}
        >
          기록 완료
        </Button>
      </div>

      <BookSearchSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
        }}
        onSelect={handleSelectBook}
      />

      <MergeDialog
        open={candidate !== null}
        myQuote={draft.quotedText}
        candidateQuote={candidate?.quotedText ?? ''}
        onMerge={() => {
          dispatch({ type: 'setMergeTarget', passageId: candidate?.passageId ?? null })
          setCandidate(null)
        }}
        onSeparate={() => {
          dispatch({ type: 'setMergeTarget', passageId: null })
          setCandidate(null)
        }}
      />

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
