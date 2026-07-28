'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useState } from 'react'

import { bookQueries } from '@/app/_global/_queries/book.queries'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { BookPickList } from '../BookPickList/BookPickList'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

export function BookPicker() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [keyword, setKeyword] = useState('')
  // 완료 화면에서 '흔적 남기기'로 돌아오면 책이 유지된 채 이 화면으로 다시 진입한다(리마운트).
  // 마운트 시점에 draft.book은 있고 quotedText가 비어 있으면 방식 선택 시트를 바로 연다.
  const [sheet, setSheet] = useState<'none' | 'source' | 'manual'>(() =>
    draft.book && !draft.quotedText ? 'source' : 'none',
  )
  const deferredKeyword = useDeferredValue(keyword)

  const recent = useQuery(bookQueries.recent())
  const searched = useQuery(bookQueries.internalSearch({ keyword: deferredKeyword }))

  // internalSearch는 keyword가 비면 enabled=false라 isPending이 계속 true다.
  // 검색 중일 때만 searched를 읽어야 '검색 안 함'이 로딩으로 보이지 않는다.
  const isSearching = deferredKeyword.trim().length > 0
  const books = (isSearching ? searched.data?.data?.books : recent.data?.data?.books) ?? []
  const status = (() => {
    if (isSearching ? searched.isPending : recent.isPending) return 'pending'
    if (isSearching ? searched.isError : recent.isError) return 'error'
    return 'ready'
  })()

  return (
    <div className="flex flex-1 flex-col bg-bg-dark">
      <input
        type="search"
        value={keyword}
        placeholder="책 제목으로 검색"
        aria-label="책 검색"
        onChange={(event) => {
          setKeyword(event.target.value)
        }}
        className="mx-4 mt-4 rounded-lg bg-bg-gray px-4 py-3 text-body-16rg text-text-inverse outline-none placeholder:opacity-50"
      />
      <BookPickList
        books={books}
        status={status}
        emptyMessage={isSearching ? '검색 결과가 없어요.' : '아직 흔적을 남긴 책이 없어요.'}
        onRetry={() => {
          void (isSearching ? searched.refetch() : recent.refetch())
        }}
        onSelect={(book) => {
          dispatch({
            type: 'selectBook',
            book: {
              bookId: book.bookId,
              title: book.title,
              author: book.author,
              coverImageUrl: book.coverImageUrl ?? null,
              pageCount: book.pageCount ?? null,
            },
          })
          setSheet('source')
        }}
      />
      <TraceSourceSheet
        open={sheet === 'source'}
        onClose={() => {
          setSheet('none')
        }}
        onSelectPhoto={() => {
          dispatch({ type: 'setSource', source: 'photo' })
          setSheet('none')
          router.push('/trace/new/photo')
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
          router.push('/trace/new/detail')
        }}
      />
    </div>
  )
}
