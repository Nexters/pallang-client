'use client'

import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import {
  BookNewForm,
  type BookNewFormStatus,
} from '@/app/_shared/book/_components/BookNewForm/BookNewForm'
import type { ExternalBookFormState } from '@/app/_shared/book/_services/bookForm.service'

type BookSearchAddFormViewProps = {
  form: ExternalBookFormState
  onClose: () => void
  onCreated: () => void
}

const BOOK_ADD_FORM_ID = 'book-search-add-form'
const IDLE_FORM_STATUS: BookNewFormStatus = { canSubmit: false, isPending: false }

export function BookSearchAddFormView({ form, onClose, onCreated }: BookSearchAddFormViewProps) {
  const [formStatus, setFormStatus] = useState<BookNewFormStatus>(IDLE_FORM_STATUS)

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title as="h1">책 추가하기</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <BookNewForm
          formId={BOOK_ADD_FORM_ID}
          initialCoverImageUrl={form.coverImageUrl}
          initialValues={form.values}
          onCreated={onCreated}
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
