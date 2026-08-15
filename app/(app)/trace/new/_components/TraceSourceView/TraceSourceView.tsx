'use client'

import { useEffect, useRef, useState } from 'react'

import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

type TraceSourceViewProps = {
  /** 흔적 보기 화면이 URL로 넘긴 씨앗. 마운트 때 한 번만 소비한다. */
  seed?: TraceSeed | null
}

/** 흔적 작성 플로우의 첫 화면. 화면 자체가 방식 선택 시트라, 시트를 닫는 것이 곧 플로우를 벗어나는 것이다. */
export function TraceSourceView({ seed = null }: TraceSourceViewProps) {
  const { draft, dispatch } = useTraceDraft()
  const { goTo, requestExit } = useTraceNav()
  // 씨앗 유무와 무관하게 이 화면은 방식 선택 시트 그 자체다 — 마운트하면 항상 연다.
  const [sheet, setSheet] = useState<'manual' | 'none' | 'source'>('source')

  // 씨앗은 첫 마운트의 것만 쓴다 — 초안을 채우면 리렌더되지만 다시 소비하면 안 된다
  const pendingSeedRef = useRef(seed)

  useEffect(() => {
    const pending = pendingSeedRef.current
    if (!pending) return
    pendingSeedRef.current = null

    dispatch({
      type: 'selectBook',
      book: {
        bookId: pending.bookId,
        title: pending.bookTitle,
        // 흔적 보기 화면은 이 둘을 모른다. 작성 플로우에서는 도서 직접 등록 폼에서만 쓰이는 값이다.
        author: '',
        coverImageUrl: pending.bookCoverImageUrl,
        pageCount: null,
      },
    })
  }, [dispatch])

  // 직접 입력 시트는 방식 선택 시트 위에 얹힌 한 층이다 — 뒤로가기는 화면을 떠나는 대신
  // 방식 선택 시트로 한 층만 걷어낸다. 방식 선택 시트 자체는 이 화면 그 자체라 별도 가드가 없다
  // — 닫히면 onClose(requestExit)가 바로 이탈 판정을 받는다.
  useOverlayBackGuard(sheet === 'manual', () => {
    setSheet('source')
  })

  return (
    <>
      {/* 시트 뒤가 루트 배경(bg-bg-dark)으로 비지 않게 한다 */}
      <div className="flex flex-1 flex-col bg-bg-dark" />
      <TraceSourceSheet
        open={sheet === 'source'}
        book={draft.book}
        onClose={requestExit}
        onSelectPhoto={() => {
          dispatch({ type: 'setSource', source: 'photo' })
          setSheet('none')
          goTo('photo')
        }}
        onSelectManual={() => {
          dispatch({ type: 'setSource', source: 'manual' })
          setSheet('manual')
        }}
      />
      <ManualQuoteSheet
        open={sheet === 'manual'}
        onClose={() => {
          setSheet('source')
        }}
        onSubmit={(quotedText) => {
          dispatch({ type: 'setQuotedText', quotedText })
          setSheet('none')
          goTo('write')
        }}
      />
    </>
  )
}
