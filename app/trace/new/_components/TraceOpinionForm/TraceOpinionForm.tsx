'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { opinionMutations } from '@/app/_global/_queries/opinion.queries'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

export function TraceOpinionForm() {
  const { draft, dispatch } = useTraceDraft()
  const { goBack, goTo } = useTraceNav()
  const [message, setMessage] = useState('')
  const createOpinion = useMutation(opinionMutations.create())
  const runWithLogin = useLoginGate()

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
        <TraceStepHeader
          step={3}
          title={'해당 대목에 남기고 싶은 흔적을\n자유롭게 작성해 주세요.'}
        />
      </div>
      {/* 노트가 밝음/어둠 경계를 가로지른다 — 시안(2295:5842): 노트 하단 199px가 어두운 배경 */}
      <div className="relative bg-bg-default px-8">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
        <div className="relative">
          <TraceNote quotedText={draft.quotedText} decorations={draft.decorations} />
        </div>
      </div>

      <div className="px-4 pt-6">
        <Textarea
          variant="dark"
          maxLength={300}
          value={draft.content}
          placeholder="의견을 작성해주세요."
          onChange={(event) => {
            dispatch({ type: 'setContent', content: event.target.value })
          }}
        />
      </div>

      <div
        className="mt-auto flex gap-2 px-4 pb-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
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
          disabled={draft.content.trim().length === 0 || createOpinion.isPending}
          onClick={handleSubmit}
        >
          흔적 남기기
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
