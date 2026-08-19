'use client'

import { useEffect, useRef, useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { useCamera } from '@/app/_global/_hooks/useCamera'
import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceCapture } from '../../_hooks/useTraceCapture'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { ManualQuoteForm } from '../ManualQuoteForm/ManualQuoteForm'
import { TraceSourceOptions } from '../TraceSourceOptions/TraceSourceOptions'

type TraceSourceViewProps = {
  /** 흔적 보기 화면이 URL로 넘긴 씨앗. 마운트 때 한 번만 소비한다. */
  seed?: TraceSeed | null
}

/** 흔적 작성 플로우의 첫 화면. 화면 자체가 방식 선택 시트라, 시트를 닫는 것이 곧 플로우를 벗어나는 것이다. */
export function TraceSourceView({ seed = null }: TraceSourceViewProps) {
  const { draft, dispatch } = useTraceDraft()
  const { goTo, markReturnable, requestExit, step } = useTraceNav()
  const { takePhoto } = useCamera()
  const capture = useTraceCapture()
  // 이 화면은 방식 선택 시트 그 자체다 — 이 단계에 서 있으면 연다. 다만 씨앗이 대목까지 물고
  // 왔으면 고를 방식이 없다(대목이 이미 있다). 그때는 열지 않고 곧장 ①로 넘어간다.
  // 'none'은 이 화면이 지나가는 자리가 되는 동안(씨앗 통과·다음 단계로 이동) 시트를 모두 닫아
  // 뒤 배경만 남기는 상태다 — 그 사이 화면이 한 프레임 스치지 않는다.
  const [sheet, setSheet] = useState<'manual' | 'none' | 'source'>(
    seed?.passage ? 'none' : 'source',
  )

  // Next는 다음 단계로 넘어가도 이 화면을 언마운트하지 않고 <Activity>로 감춰 두었다가
  // 되살린다(Cache Components). 그래서 마운트 때 한 번 정해지는 useState 초기값에 기댈 수 없다
  // — 떠나며 닫아 둔 시트가 닫힌 채로 되살아나고, 이 화면 뒤에는 빈 배경뿐이라 빈 화면이 된다.
  // 시트를 여는 판단을 마운트가 아니라 '지금 이 단계에 서 있는가'에 매달고, 떠나 있는 동안
  // 처음 자리로 되돌려 둔다. 되돌리는 것도 감춰진 동안이지 되살아난 뒤가 아니다 —
  // 감춰진 채로 열어 두면 시트가 그 사이의 열림을 놓쳐 되살아나도 끝내 뜨지 않는다.
  const isCurrentStep = step === 'source'
  if (!isCurrentStep && sheet !== 'source') setSheet('source')
  const openSheet = isCurrentStep ? sheet : 'none'

  // 씨앗은 첫 마운트의 것만 쓴다 — 초안을 채우면 리렌더되지만 다시 소비하면 안 된다
  const pendingSeedRef = useRef(seed)

  useEffect(() => {
    const pending = pendingSeedRef.current
    if (!pending) return
    pendingSeedRef.current = null

    // 씨앗은 흔적 보기가 push로만 만든다(useTraceCreateNav) — 되감을 자리가 반드시 있다.
    // 나갈 때 홈으로 튕기지 않고 보고 있던 흔적으로 되돌아가는 근거가 이 표시다.
    markReturnable()

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
  }, [dispatch, goTo, markReturnable])

  // 직접 입력 시트는 방식 선택 시트 위에 얹힌 한 층이다 — 뒤로가기는 화면을 떠나는 대신
  // 방식 선택 시트로 한 층만 걷어낸다. 방식 선택 시트 자체는 이 화면 그 자체라 별도 가드가 없다
  // — 닫히면 onClose(requestExit)가 바로 이탈 판정을 받는다.
  useOverlayBackGuard(openSheet === 'manual', () => {
    setSheet('source')
  })

  return (
    <>
      {/* 시트 뒤가 루트 배경(bg-bg-dark)으로 비지 않게 한다 */}
      <div className="flex flex-1 flex-col bg-bg-dark" />
      {/* 방식 선택과 직접 입력은 시트 하나를 나눠 쓴다. 시트를 둘로 두면 하나가 내려가는
          동안 다른 하나가 올라와 둘이 교차하고, 백드롭도 각자라 어두운 층이 꺼졌다 켜진다.
          panelKey로 패널만 다시 꽂아 등장 전환은 그대로 타되 백드롭은 이어지게 한다. */}
      <BottomSheet
        open={openSheet !== 'none'}
        panelKey={openSheet}
        title={openSheet === 'manual' ? '직접 입력' : '새로운 기록을 어떻게 남길까요?'}
        onClose={() => {
          // 직접 입력에서 닫으면 플로우를 벗어나는 대신 한 층만 걷어낸다
          if (openSheet === 'manual') {
            setSheet('source')
            return
          }
          requestExit()
        }}
      >
        {openSheet === 'manual' ? (
          <ManualQuoteForm
            onSubmit={(quotedText) => {
              dispatch({ type: 'setQuotedText', quotedText })
              setSheet('none')
              goTo('write')
            }}
          />
        ) : (
          <TraceSourceOptions
            book={draft.book}
            onSelectPhoto={() => {
              // 카메라는 이 탭 안에서 연다. 사진 화면으로 옮겨 간 뒤 그쪽 effect에서 열면
              // 브라우저 조작 권한이 이미 끊겨 파일 선택창이 조용히 무시된다(TraceCaptureProvider 참고).
              // 시작만 여기서 하고 결과는 사진 화면이 이어받는다 — 전환은 지금처럼 곧바로 일어난다.
              capture.hand(takePhoto('camera'))
              dispatch({ type: 'setSource', source: 'photo' })
              setSheet('none')
              goTo('photo')
            }}
            onSelectManual={() => {
              dispatch({ type: 'setSource', source: 'manual' })
              setSheet('manual')
            }}
          />
        )}
      </BottomSheet>
    </>
  )
}
