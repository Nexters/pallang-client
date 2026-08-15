'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import {
  type BookFormValues,
  emptyBookForm,
  normalizeExternalAuthor,
} from '../../_services/bookForm.service'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookAddForm } from '../BookAddForm/BookAddForm'
import { BookSearchView } from '../BookSearchView/BookSearchView'
import type { ExternalBook } from '../ExternalBookList/ExternalBookList'

type BookSearchSheetProps = {
  open: boolean
  onClose: () => void
  onSelect: (book: SelectedBook) => void
}

type AddFormState = { coverImageUrl: null | string; values: BookFormValues }

// 저장하기 버튼은 폼 본문이 아니라 시트의 footer 슬롯(스크롤에 딸려 올라가지 않는 고정 영역)에
// 산다 — HTML의 form 속성으로 이 id의 <form>을 가리켜, 밖에 있어도 제출은 그대로 이어진다.
const BOOK_ADD_FORM_ID = 'book-add-form'

export function BookSearchSheet({ open, onClose, onSelect }: BookSearchSheetProps) {
  // 목록·캐러셀에서 고른 책은 후보일 뿐이다 — 하단 '등록하기'를 눌러야 onSelect로 확정된다.
  const [picked, setPicked] = useState<SelectedBook | null>(null)
  // 직접 등록 폼은 시트를 닫지 않고 같은 시트의 본문을 갈아끼운다(헤더·풀하이트·백드롭을 그대로 쓴다).
  // BookAddForm을 별도 fixed 레이어로 얹으면 base-ui가 모달 바깥 형제를 aria-hidden 처리해
  // 폼이 스크린리더에서 사라진다 — 같은 다이얼로그 안에 있어야 그 문제가 없다.
  const [form, setForm] = useState<AddFormState | null>(null)
  // BookAddForm의 저장 버튼이 footer로 옮겨가 폼 밖에 있다 — disabled 여부를 이 state로 받는다.
  const [formPending, setFormPending] = useState(false)

  const closeForm = () => {
    setForm(null)
    // 다음에 폼을 다시 열 때 직전 세션의 disabled 상태가 한 프레임이라도 새어 나오지 않게 한다.
    setFormPending(false)
  }

  // 폼이 본문을 차지하는 동안에는 하드웨어 뒤로가기가 시트를 나가는 대신 폼만 닫는다.
  useOverlayBackGuard(form !== null, closeForm)

  const handleCreated = (book: SelectedBook) => {
    // 직접 등록한 책은 다시 고를 이유가 없다 — 후보를 거치지 않고 바로 확정한다.
    setForm(null)
    setFormPending(false)
    onSelect(book)
  }

  return (
    <BottomSheet
      open={open}
      title={form ? '책 추가하기' : '책 검색'}
      leading="back"
      fullHeight
      onClose={() => {
        // 헤더의 ←·Escape·바깥 탭도 하드웨어 뒤로가기와 같은 규칙을 따른다:
        // 폼이 열려 있으면 폼만 닫고, 아니면 시트 전체를 닫는다.
        if (form) {
          closeForm()
          return
        }
        onClose()
      }}
      footer={
        form ? (
          <Button
            type="submit"
            form={BOOK_ADD_FORM_ID}
            className="h-[54px] w-full"
            disabled={formPending}
          >
            저장하기
          </Button>
        ) : (
          <Button
            variant="activated"
            className="w-full"
            disabled={!picked}
            onClick={() => {
              if (picked) onSelect(picked)
            }}
          >
            등록하기
          </Button>
        )
      }
    >
      {/* 폼을 여닫아도 검색 상태(검색어·목록·페이지네이션)가 사라지지 않도록 마운트는 유지하고
          hidden으로만 감춘다 — 언마운트하면 SearchTextfield의 비제어 입력값도 함께 날아간다. */}
      <BookSearchView
        hidden={form !== null}
        selectedBookId={picked?.bookId ?? null}
        onPick={setPicked}
        onAddManually={() => {
          setForm({ coverImageUrl: null, values: emptyBookForm })
        }}
        onSelectExternal={(book: ExternalBook) => {
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
        }}
      />
      {form && (
        <BookAddForm
          coverImageUrl={form.coverImageUrl}
          formId={BOOK_ADD_FORM_ID}
          initialValues={form.values}
          onCreated={handleCreated}
          onPendingChange={setFormPending}
        />
      )}
    </BottomSheet>
  )
}
