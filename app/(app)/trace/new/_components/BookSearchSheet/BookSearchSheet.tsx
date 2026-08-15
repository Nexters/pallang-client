'use client'

import { use, useEffect, useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'

import { TraceOverlayContext } from '../../_data/traceOverlay.store'
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

export function BookSearchSheet({ open, onClose, onSelect }: BookSearchSheetProps) {
  // 목록·캐러셀에서 고른 책은 후보일 뿐이다 — 하단 '등록하기'를 눌러야 onSelect로 확정된다.
  const [picked, setPicked] = useState<SelectedBook | null>(null)
  // 직접 등록 폼은 시트를 닫지 않고 그 위에 얹는다.
  const [form, setForm] = useState<AddFormState | null>(null)

  // useOverlayBackGuard(→useTraceOverlay)는 TraceOverlayProvider 밖에서 쓰이면 던진다.
  // 이 시트는 단독으로도(테스트에서처럼 provider 없이) 쓰일 수 있어 컨텍스트를 직접 읽고,
  // 있을 때만 등록한다 — provider 안에서 쓰일 때(Task 9)는 뒤로가기가 폼만 닫는다.
  const overlay = use(TraceOverlayContext)
  useEffect(() => {
    if (!open || !form || !overlay) return
    return overlay.register(() => {
      setForm(null)
    })
  }, [open, form, overlay])

  const closeForm = () => {
    setForm(null)
  }

  const handleCreated = (book: SelectedBook) => {
    // 직접 등록한 책은 다시 고를 이유가 없다 — 후보를 거치지 않고 바로 확정한다.
    setForm(null)
    onSelect(book)
  }

  return (
    <>
      <BottomSheet
        open={open}
        title="책 검색"
        leading="back"
        fullHeight
        onClose={onClose}
        footer={
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
        }
      >
        <BookSearchView
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
      </BottomSheet>

      {open && form && (
        <div className="fixed inset-0 z-[60]">
          <BookAddForm
            coverImageUrl={form.coverImageUrl}
            initialValues={form.values}
            onClose={closeForm}
            onCreated={handleCreated}
          />
        </div>
      )}
    </>
  )
}
