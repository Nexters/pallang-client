'use client'

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import {
  FEEDBACK_ILLUSTRATION_SIZE,
  FEEDBACK_ILLUSTRATION_SRC,
} from '@/app/_global/_data/feedbackIllustration.constant'
import { useDebouncedValue } from '@/app/_global/_hooks/useDebouncedValue'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import {
  BookNewForm,
  type BookNewFormStatus,
} from '@/app/_shared/book/_components/BookNewForm/BookNewForm'
import { BookSearchBar } from '@/app/_shared/book/_components/BookSearchBar/BookSearchBar'
import {
  type BookFormValues,
  normalizeExternalAuthor,
} from '@/app/_shared/book/_services/bookForm.service'

import { BookCoverCarousel } from '../BookCoverCarousel/BookCoverCarousel'
import { BookSearchResultList } from '../BookSearchResultList/BookSearchResultList'

const PAGE_SIZE = 20
const SKELETON_KEYS = ['a', 'b', 'c']
const BOOK_ADD_FORM_ID = 'book-search-add-form'
const IDLE_FORM_STATUS: BookNewFormStatus = { canSubmit: false, isPending: false }

type ExternalBookResult = {
  author: string
  coverImageUrl: null | string
  isbn: string
  publisher: string
  title: string
}

type AddFormState = { coverImageUrl: null | string; values: BookFormValues }

function ExternalSearchFallback({
  books,
  isPending,
  onSelect,
}: {
  books: ExternalBookResult[]
  isPending: boolean
  onSelect: (book: ExternalBookResult) => void
}) {
  return (
    <section aria-label="팔랑에 없는 책 검색 결과" className="flex flex-col">
      <div className="flex flex-col items-center gap-4 px-4 pt-3">
        <Image
          src={FEEDBACK_ILLUSTRATION_SRC}
          alt=""
          {...FEEDBACK_ILLUSTRATION_SIZE}
          aria-hidden="true"
          className="h-24 w-[120px] object-bottom opacity-40"
        />
        <p className="text-center font-pretendard text-title-18md text-text-secondary">
          검색하신 책은 현재 팔랑에 남겨지지 않았어요!
          <br />
          오탈자인지 먼저 확인해주시고,
          <br />
          아니라면 직접 첫 기록을 남겨주세요!
        </p>
      </div>

      {isPending ? (
        <div
          role="status"
          aria-label="외부 책을 불러오는 중"
          className="flex flex-col gap-3 px-4 py-6"
        >
          {SKELETON_KEYS.map((key) => (
            <div key={key} className="flex animate-pulse gap-4">
              <div className="h-[120px] w-20 shrink-0 rounded-[2px] bg-bg-surface" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="h-5 w-2/3 rounded bg-bg-surface" />
                <div className="h-4 w-1/2 rounded bg-bg-surface" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul aria-label="외부 도서 검색 결과" className="flex flex-col gap-3 px-4 py-6">
          {books.map((book, index) => (
            <li key={`${book.isbn}-${book.title}-${String(index)}`} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelect(book)
                }}
                className="press w-full text-left"
              >
                <BookItem
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  publisher={book.publisher}
                  title={book.title}
                />
              </button>
              {index < books.length - 1 && <div className="h-px w-full bg-border-default" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function BookSearchPageView() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState<AddFormState | null>(null)
  const [formStatus, setFormStatus] = useState<BookNewFormStatus>(IDLE_FORM_STATUS)
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)
  const isSearching = debouncedKeyword.length > 0
  const isTypingAhead = keyword.trim() !== debouncedKeyword

  const me = useQuery(userQueries.me())
  const recent = useQuery(bookQueries.recent({ size: PAGE_SIZE }))
  const popular = useQuery(bookQueries.popular({ size: PAGE_SIZE }))
  const searched = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: isSearching,
    placeholderData: keepPreviousData,
  })

  // 통합 검색이 생기면서 응답의 bookId가 선택 항목이 됐다(미등록 도서는 비어 있다).
  // 여기는 내부 검색이라 모두 등록된 도서지만, 타입이 그걸 모르므로 bookId 없는 항목은 걸러 낸다.
  const searchedBooks =
    searched.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).flatMap((book) =>
        book.bookId == null ? [] : [{ ...book, bookId: book.bookId }],
      ),
    ) ?? []
  const shouldSearchExternal =
    isSearching &&
    !isTypingAhead &&
    !searched.isPending &&
    !searched.isError &&
    searchedBooks.length === 0
  const external = useQuery({
    ...bookQueries.searchExternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
    enabled: shouldSearchExternal,
  })
  const externalBooks: ExternalBookResult[] = (external.data?.data?.books ?? []).map((book) => ({
    author: book.author,
    coverImageUrl: book.coverImageUrl ?? null,
    isbn: book.isbn ?? '',
    publisher: book.publisher,
    title: book.title,
  }))
  const searchStatus = (() => {
    if (searched.isPending || isTypingAhead) return 'pending'
    if (searched.isError && searchedBooks.length === 0) return 'error'
    return 'ready'
  })()
  const showRecent = recent.isPending || (recent.data?.data?.books.length ?? 0) > 0
  const showPopular = popular.isPending || (popular.data?.data?.books.length ?? 0) > 0
  const showExternalFallback = shouldSearchExternal && !searched.isError

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled:
      isSearching &&
      !isTypingAhead &&
      searched.hasNextPage &&
      !searched.isError &&
      !searched.isFetchingNextPage,
    onLoadMore: () => {
      void searched.fetchNextPage()
    },
  })

  const resetKeyword = () => {
    setKeyword('')
  }

  const handleBookSelect = (bookId: number) => {
    resetKeyword()
    router.push(`/trace/${String(bookId)}`)
  }

  const openExternalForm = (book: ExternalBookResult) => {
    setForm({
      coverImageUrl: book.coverImageUrl,
      values: {
        author: normalizeExternalAuthor(book.author),
        isbn: book.isbn,
        pageCount: '',
        publisher: book.publisher,
        title: book.title,
      },
    })
  }

  const closeForm = () => {
    setForm(null)
    setFormStatus(IDLE_FORM_STATUS)
  }

  if (form) {
    return (
      <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
        <TopBar.Root>
          <TopBar.Title as="h1">책 추가하기</TopBar.Title>
          <TopBar.Spacer />
          <TopBar.Action aria-label="닫기" onClick={closeForm}>
            <CloseIcon />
          </TopBar.Action>
        </TopBar.Root>

        <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <BookNewForm
            formId={BOOK_ADD_FORM_ID}
            initialCoverImageUrl={form.coverImageUrl}
            initialValues={form.values}
            onCreated={() => {
              router.replace('/book/list')
            }}
            onStatusChange={setFormStatus}
          />
        </div>

        <div className="mt-auto flex shrink-0 px-4 pt-4 pb-safe">
          <Button
            type="submit"
            form={BOOK_ADD_FORM_ID}
            className="h-[54px] flex-1"
            disabled={!formStatus.canSubmit}
            loading={formStatus.isPending}
          >
            저장하기
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title as="h1">책 검색</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action
          aria-label="닫기"
          onClick={() => {
            resetKeyword()
            if (window.history.length <= 1) {
              router.replace('/book/list')
              return
            }
            router.back()
          }}
        >
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>
      <BookSearchBar
        autoFocus
        placeholder="책 제목을 입력해 주세요."
        value={keyword}
        onKeywordChange={setKeyword}
      />

      <div
        ref={scrollRef}
        className={cn(
          'scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden',
          showExternalFallback && 'pb-24',
        )}
      >
        {isSearching ? (
          <>
            {showExternalFallback ? (
              <ExternalSearchFallback
                books={externalBooks}
                isPending={external.isPending}
                onSelect={openExternalForm}
              />
            ) : (
              <BookSearchResultList
                books={searchedBooks}
                status={searchStatus}
                onAddBook={() => {
                  resetKeyword()
                  router.push('/book/new')
                }}
                onLeave={resetKeyword}
                onRetry={() => {
                  void searched.refetch()
                }}
              />
            )}
            <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
          </>
        ) : showRecent || showPopular ? (
          <div className="flex flex-col gap-10 px-4 pt-6 pb-10">
            {showRecent && (
              <BookCoverCarousel
                title={`${me.data?.data?.nickname ?? '나'}님이 최근에 남긴 흔적`}
                books={recent.data?.data?.books ?? []}
                isPending={recent.isPending}
                onSelect={handleBookSelect}
              />
            )}
            {showPopular && (
              <BookCoverCarousel
                title="제일 많이 등록된 흔적"
                books={popular.data?.data?.books ?? []}
                isPending={popular.isPending}
                onSelect={handleBookSelect}
              />
            )}
          </div>
        ) : (
          <BookSearchResultList
            books={[]}
            status="ready"
            onAddBook={() => {
              resetKeyword()
              router.push('/book/new')
            }}
            onLeave={resetKeyword}
            onRetry={() => undefined}
          />
        )}
      </div>
      {showExternalFallback && (
        <div className="mt-auto flex shrink-0 items-center justify-center gap-1.5 bg-bg-default px-4 py-6 text-body-14md text-text-tertiary">
          찾는 책이 없나요?
          <button
            type="button"
            onClick={() => {
              resetKeyword()
              router.push('/book/new')
            }}
            className="press text-title-14bd text-text-accent underline"
          >
            새 책 등록하기
          </button>
        </div>
      )}
    </main>
  )
}
