'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { opinionMutations } from '@/app/_global/_queries/opinion.queries'
import { passageMutations } from '@/app/_global/_queries/passage.queries'
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
  const similarCheck = useMutation(passageMutations.similarCheck())
  const createOpinion = useMutation(opinionMutations.create())
  const runWithLogin = useLoginGate()

  // 병합 다이얼로그가 떠 있는 동안에는 뒤로가기가 화면을 나가는 대신 다이얼로그만 닫는다.
  useOverlayBackGuard(candidate !== null, () => {
    setCandidate(null)
  })

  const handleSelectBook = (book: SelectedBook) => {
    dispatch({ type: 'selectBook', book })
    setSheetOpen(false)
    similarCheck.mutate(
      { bookId: book.bookId, pageNumber: draft.pageNumber ?? 0, quotedText: draft.quotedText },
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
  }

  const handleSubmit = () => {
    if (!draft.book) return
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

  return (
    <div className="relative flex flex-1 flex-col bg-bg-dark">
      {/* 흰 상단이 노치 뒤까지 채워지도록 셸 패딩을 되돌리고(-mt) 안에서 다시 더한다 */}
      <div className="-mt-(--safe-top) bg-bg-default pt-(--safe-top)">
        <TraceStepIndicator current={3} />
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pt-6 pb-4">
        <div className="px-4">
          <button
            type="button"
            aria-label="책 다시 고르기"
            onClick={() => {
              setSheetOpen(true)
            }}
            className="w-full cursor-pointer rounded-lg bg-bg-surface/10 p-3 text-left"
          >
            {draft.book && (
              <BookItem
                author={draft.book.author}
                coverImageUrl={draft.book.coverImageUrl}
                title={draft.book.title}
              />
            )}
          </button>
        </div>

        <div className="px-8">
          <TraceNote quotedText={draft.quotedText} decorations={draft.decorations} />
        </div>

        <TraceOpinionPreview content={draft.content} />
      </div>

      <div className="mt-auto flex gap-2 px-4 pb-safe">
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
          등록하기
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
