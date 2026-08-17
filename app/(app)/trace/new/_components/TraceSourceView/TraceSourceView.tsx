'use client'

import { useEffect, useRef, useState } from 'react'

import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceNewSkeleton } from '../TraceNewSkeleton/TraceNewSkeleton'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

type TraceSourceViewProps = {
  /** 흔적 보기 화면이 URL로 넘긴 씨앗. 마운트 때 한 번만 소비한다. */
  seed?: TraceSeed | null
}

/** 흔적 작성 플로우의 첫 화면. 화면 자체가 방식 선택 시트라, 시트를 닫는 것이 곧 플로우를 벗어나는 것이다. */
export function TraceSourceView({ seed = null }: TraceSourceViewProps) {
  const { draft, dispatch } = useTraceDraft()
  const { goTo, requestExit } = useTraceNav()
  // 이 화면은 방식 선택 시트 그 자체다 — 마운트하면 연다. 다만 씨앗이 대목까지 물고 왔으면
  // 고를 방식이 없다(대목이 이미 있다). 그때는 열지 않고 곧장 ①로 넘어간다.
  const [sheet, setSheet] = useState<'manual' | 'none' | 'source'>(
    seed?.passage ? 'none' : 'source',
  )

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
        // 흔적 보기 화면은 이 둘을 모른다 — 그 화면의 책 정보는 PageNumbers 응답에서 오고
        // 제목·표지밖에 없다. 빈 채로 두면 ③의 책 카드에 저자 줄이 비고 쪽수 검사도 건너뛰므로,
        // layout의 BookDetailFiller가 내부 검색으로 뒤이어 채운다.
        author: '',
        coverImageUrl: pending.bookCoverImageUrl,
        pageCount: null,
      },
    })

    const { passage } = pending
    if (!passage) return

    // 순서가 중요하다 — setQuotedText가 꾸밈을 비우고 selectBook이 합칠 대목을 지우므로,
    // 꾸밈 이어받기와 setMergeTarget이 반드시 뒤에 와야 한다.
    dispatch({ type: 'setQuotedText', quotedText: passage.quotedText })
    dispatch({
      type: 'setPageDetail',
      pageNumber: passage.pageNumber,
      isSpoiler: passage.isSpoiler,
    })
    for (const decoration of passage.decorations) {
      dispatch({ type: 'applyDecoration', decoration })
    }
    dispatch({ type: 'setMergeTarget', passageId: passage.passageId })
    // 대목의 출처를 남긴다 — ①이 이 값을 보고 "받을 것은 의견뿐"임을 안다(seededPassage.service).
    dispatch({ type: 'setSource', source: 'passage' })
    goTo('write')
  }, [dispatch, goTo])

  // 직접 입력 시트는 방식 선택 시트 위에 얹힌 한 층이다 — 뒤로가기는 화면을 떠나는 대신
  // 방식 선택 시트로 한 층만 걷어낸다. 방식 선택 시트 자체는 이 화면 그 자체라 별도 가드가 없다
  // — 닫히면 onClose(requestExit)가 바로 이탈 판정을 받는다.
  useOverlayBackGuard(sheet === 'manual', () => {
    setSheet('source')
  })

  // ①로 넘어가는 사이 이 화면이 한 프레임 스치지 않게 가린다(삭제된 BookPicker가 쓰던 처리).
  // 훅을 모두 부른 뒤에 빠져나간다 — 호출 순서가 렌더마다 같아야 한다.
  if (seed?.passage && !draft.quotedText) return <TraceNewSkeleton />

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
