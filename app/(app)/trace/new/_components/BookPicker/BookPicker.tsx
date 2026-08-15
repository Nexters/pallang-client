'use client'

import { useEffect, useRef, useState } from 'react'

import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import {
  type BookFormValues,
  emptyBookForm,
  normalizeExternalAuthor,
} from '../../_services/bookForm.service'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookAddForm } from '../BookAddForm/BookAddForm'
import { BookSearchView } from '../BookSearchView/BookSearchView'
import type { ExternalBook } from '../ExternalBookList/ExternalBookList'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

type PickerView =
  { coverImageUrl: null | string; type: 'form'; values: BookFormValues } | { type: 'search' }

type BookPickerProps = {
  /** 흔적 보기 화면이 URL로 넘긴 씨앗. 마운트 때 한 번만 소비한다. */
  seed?: TraceSeed | null
}

export function BookPicker({ seed = null }: BookPickerProps) {
  const { draft, dispatch } = useTraceDraft()
  const { goTo, requestExit } = useTraceNav()
  const [view, setView] = useState<PickerView>({ type: 'search' })
  // 완료 화면에서 '흔적 남기기'로 돌아오면 책이 유지된 채 이 화면으로 다시 진입한다(리마운트).
  // 마운트 시점에 draft.book이 있고 quotedText가 비어 있으면 방식 선택 시트를 바로 연다.
  // 책만 담긴 씨앗으로 들어온 경우도 같다 — 대목은 늘 새로 입력하므로 바로 시트를 연다.
  const [sheet, setSheet] = useState<'manual' | 'none' | 'source'>(() => {
    if (seed) return 'source'
    return draft.book && !draft.quotedText ? 'source' : 'none'
  })

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

  const closeForm = () => {
    setView({ type: 'search' })
  }

  // 폼과 시트는 뒤로가기가 화면을 떠나는 대신 한 층씩 걷어내야 하는 대상이다
  useOverlayBackGuard(view.type === 'form', closeForm)
  useOverlayBackGuard(sheet !== 'none', () => {
    setSheet('none')
  })

  const handleSelect = (book: SelectedBook) => {
    dispatch({ type: 'selectBook', book })
    setView({ type: 'search' })
    setSheet('source')
  }

  return (
    <>
      {view.type === 'form' ? (
        <BookAddForm
          coverImageUrl={view.coverImageUrl}
          initialValues={view.values}
          onClose={closeForm}
          onCreated={handleSelect}
        />
      ) : (
        <BookSearchView
          onAddManually={() => {
            setView({ coverImageUrl: null, type: 'form', values: emptyBookForm })
          }}
          onBack={requestExit}
          onSelect={handleSelect}
          onSelectExternal={(book: ExternalBook) => {
            // 알라딘은 쪽수를 주지 않는다. 나머지만 채우고 페이지 수는 사용자가 입력한다.
            setView({
              coverImageUrl: book.coverImageUrl,
              type: 'form',
              values: {
                author: normalizeExternalAuthor(book.author),
                isbn: book.isbn,
                pageCount: '',
                publisher: book.publisher,
                title: book.title,
              },
            })
          }}
        />
      )}

      <TraceSourceSheet
        open={sheet === 'source'}
        onClose={() => {
          setSheet('none')
        }}
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
          setSheet('none')
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
