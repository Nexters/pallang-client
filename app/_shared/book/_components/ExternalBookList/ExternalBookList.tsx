'use client'

import Image from 'next/image'

import {
  FEEDBACK_ILLUSTRATION_SIZE,
  FEEDBACK_ILLUSTRATION_SRC,
} from '@/app/_global/_data/feedbackIllustration.constant'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import { BookSelectRibbon } from '@/app/_shared/book/_components/BookSelectRibbon/BookSelectRibbon'

export type ExternalBook = {
  author: string
  coverImageUrl: null | string
  isbn: string
  publisher: string
  title: string
}

type ExternalBookListProps = {
  books: ExternalBook[]
  isPending: boolean
  /** 항목 탭은 확정이 아니라 후보 선택이다(#343) — 확정은 시트 footer의 '등록하기'가 맡는다. */
  onSelect: (book: ExternalBook) => void
  /** 지금 후보로 고른 외부 책. 알라딘 결과에는 bookId가 없어 객체로 받아 isbn+제목으로 비교한다. */
  selectedBook?: ExternalBook | null
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function ExternalBookList({
  books,
  isPending,
  onSelect,
  selectedBook = null,
}: ExternalBookListProps) {
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
          {books.map((book) => {
            const isSelected =
              selectedBook !== null &&
              selectedBook.isbn === book.isbn &&
              selectedBook.title === book.title
            return (
              // 알라딘 결과에는 bookId가 없다. 같은 책의 다른 판본이 섞이므로 isbn+제목으로 구분한다.
              <li key={`${book.isbn}-${book.title}`}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelect(book)
                  }}
                  className="relative w-full cursor-pointer text-left"
                >
                  <BookItem
                    author={book.author}
                    className="pr-12"
                    coverImageUrl={book.coverImageUrl}
                    publisher={book.publisher}
                    title={book.title}
                    titleBehavior="clamp"
                  />
                  {isSelected && <BookSelectRibbon />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
