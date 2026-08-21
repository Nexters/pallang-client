'use client'

import { useEffect, useRef, useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import {
  BookNewForm,
  type BookNewFormStatus,
} from '@/app/_shared/book/_components/BookNewForm/BookNewForm'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'
import {
  type BookFormValues,
  emptyBookForm,
  normalizeExternalAuthor,
} from '@/app/_shared/book/_services/bookForm.service'

import { BookSearchView } from '../BookSearchView/BookSearchView'
import type { ExternalBook } from '../ExternalBookList/ExternalBookList'

type BookSearchSheetProps = {
  open: boolean
  /** 시트 제목 — 흔적 ③은 '책 등록하기', 모임 만들기는 '책 선택하기'(시안 3321:28250) */
  title?: string
  onClose: () => void
  onSelect: (book: SelectedBook) => void
  /**
   * 시트 안 도서 등록 폼이 열린 동안 뒤로가기(하드웨어/제스처)가 폼만 닫게 등록한다.
   * 흔적 플로우는 TraceOverlayProvider의 register, 모임은 HardwareBackProvider의 register를 넘긴다.
   * 시트 자체의 열림 가드는 여는 쪽이 등록한다(여기서는 폼 층만).
   */
  onRegisterBack?: (close: () => void) => () => void
}

type AddFormState = { coverImageUrl: null | string; values: BookFormValues }

// 어느 목록에서 골랐든 탭은 후보 선택일 뿐이다(#343). 팔랑에 있는 책은 '등록하기'가 그대로
// 확정(onSelect)하고, 외부(알라딘) 책은 쪽수가 없어 '등록하기'가 도서 추가 폼으로 잇는다.
type PickedBook = { kind: 'external'; book: ExternalBook } | { kind: 'pallang'; book: SelectedBook }

// 저장하기 버튼은 폼 본문이 아니라 시트의 footer 슬롯(스크롤에 딸려 올라가지 않는 고정 영역)에
// 산다 — HTML의 form 속성으로 이 id의 <form>을 가리켜, 밖에 있어도 제출은 그대로 이어진다.
const BOOK_ADD_FORM_ID = 'book-add-form'

const IDLE_FORM_STATUS: BookNewFormStatus = { canSubmit: false, isPending: false }

export function BookSearchSheet({
  open,
  title = '책 등록하기',
  onClose,
  onSelect,
  onRegisterBack,
}: BookSearchSheetProps) {
  // 목록·캐러셀·외부 결과에서 고른 책은 후보일 뿐이다 — 하단 '등록하기'를 눌러야 확정된다.
  const [picked, setPicked] = useState<PickedBook | null>(null)
  // 직접 등록 폼은 시트를 닫지 않고 같은 시트의 본문을 갈아끼운다(헤더·풀하이트·백드롭을 그대로 쓴다).
  // 도서 등록 지면(/book/new)으로 라우팅하지 않는 이유는 TraceDraftContext가 /trace/new 레이아웃
  // 안에 살기 때문이다 — 화면을 떠나면 대목·페이지·꾸밈·의견이 통째로 사라진다.
  // 그렇다고 별도 fixed 레이어로 얹으면 base-ui가 모달 바깥 형제를 aria-hidden 처리해
  // 폼이 스크린리더에서 사라진다 — 같은 다이얼로그 안에 있어야 그 문제가 없다.
  const [form, setForm] = useState<AddFormState | null>(null)
  // BookNewForm의 저장 버튼이 footer로 옮겨가 폼 밖에 있다 — disabled 판단에 쓸 상태를 받아 둔다.
  const [formStatus, setFormStatus] = useState<BookNewFormStatus>(IDLE_FORM_STATUS)

  const openBlankForm = () => {
    setForm({ coverImageUrl: null, values: emptyBookForm })
  }

  const openExternalForm = (book: ExternalBook) => {
    // 알라딘은 쪽수를 주지 않는다. 나머지만 채우고 페이지 수는 사용자가 입력한다.
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

  const confirmPicked = () => {
    if (!picked) return
    if (picked.kind === 'pallang') {
      onSelect(picked.book)
      return
    }
    openExternalForm(picked.book)
  }

  const closeForm = () => {
    setForm(null)
    // 다음에 폼을 다시 열 때 직전 세션의 disabled 상태가 한 프레임이라도 새어 나오지 않게 한다.
    setFormStatus(IDLE_FORM_STATUS)
  }

  // 폼이 본문을 차지하는 동안에는 하드웨어 뒤로가기가 시트를 나가는 대신 폼만 닫는다.
  // register는 여는 쪽(흔적은 TraceOverlayProvider, 모임은 HardwareBackProvider)이 넘긴다.
  const closeFormRef = useRef(closeForm)
  useEffect(() => {
    closeFormRef.current = closeForm
  })
  const formOpen = form !== null
  useEffect(() => {
    if (!onRegisterBack || !formOpen) return
    return onRegisterBack(() => {
      closeFormRef.current()
    })
  }, [formOpen, onRegisterBack])

  // 헤더의 ←·Escape·바깥 탭·하드웨어 뒤로가기가 모두 같은 규칙을 따른다:
  // 폼이 열려 있으면 폼만 닫고, 아니면 시트 전체를 닫는다.
  const closeTopLayer = () => {
    if (form) {
      closeForm()
      return
    }
    onClose()
  }

  const handleCreated = (book: SelectedBook) => {
    // 직접 등록한 책은 다시 고를 이유가 없다 — 후보를 거치지 않고 바로 확정한다.
    setForm(null)
    setFormStatus(IDLE_FORM_STATUS)
    onSelect(book)
  }

  return (
    <BottomSheet
      open={open}
      title={form ? '책 추가하기' : title}
      // 화면 상단 여백만 남기고 채운다 — 본문이 시트 안에서 스크롤되고 footer는 바닥에 붙는다
      popupClassName="h-[calc(100%-40px)]"
      // 여백은 본문 대신 안쪽 조각(검색바·목록·등록 폼)이 각자 px-4로 갖는다 — 여기서 p-4를 주면
      // 그 위에 겹쳐 시안의 16px가 32px가 된다. 도서 등록 지면(BookNewPageView)도 같은 구성이다.
      contentClassName="flex min-h-0 flex-1 flex-col overflow-y-auto"
      onBack={closeTopLayer}
      onClose={closeTopLayer}
      footer={
        form ? (
          <Button
            type="submit"
            form={BOOK_ADD_FORM_ID}
            className="h-[54px] w-full"
            disabled={!formStatus.canSubmit}
            loading={formStatus.isPending}
          >
            저장하기
          </Button>
        ) : (
          <>
            {/* 도서 등록으로 빠져나가는 유일한 길이다 — 검색바 옆 '도서 추가' 버튼을 대신한다.
                본문이 아니라 footer에 두어 검색 전·검색 결과 어느 쪽에서도 같은 자리에 늘 보인다. */}
            <p className="flex items-center justify-center gap-1.5 py-6 text-body-14md text-neutral-500">
              찾는 책이 없나요?
              <button
                type="button"
                onClick={openBlankForm}
                className="press text-title-14bd text-text-accent underline"
              >
                새 책 등록하기
              </button>
            </p>
            <Button
              variant="activated"
              className="w-full disabled:bg-interactive-accent disabled:opacity-40"
              disabled={!picked}
              onClick={confirmPicked}
            >
              등록하기
            </Button>
          </>
        )
      }
    >
      {/* 폼을 여닫아도 검색 상태(검색어·목록·페이지네이션)가 사라지지 않도록 마운트는 유지하고
          hidden으로만 감춘다 — 언마운트하면 SearchTextfield의 비제어 입력값도 함께 날아간다. */}
      <BookSearchView
        hidden={form !== null}
        selectedBookId={picked?.kind === 'pallang' ? picked.book.bookId : null}
        selectedExternalBook={picked?.kind === 'external' ? picked.book : null}
        onPick={(book: SelectedBook) => {
          setPicked({ kind: 'pallang', book })
        }}
        onPickExternal={(book: ExternalBook) => {
          setPicked({ kind: 'external', book })
        }}
        onAddManually={openBlankForm}
      />
      {form && (
        <BookNewForm
          formId={BOOK_ADD_FORM_ID}
          initialCoverImageUrl={form.coverImageUrl}
          initialValues={form.values}
          onCreated={handleCreated}
          // setState는 렌더마다 같은 함수라 폼의 상태 보고 effect가 헛돌지 않는다
          onStatusChange={setFormStatus}
        />
      )}
    </BottomSheet>
  )
}
