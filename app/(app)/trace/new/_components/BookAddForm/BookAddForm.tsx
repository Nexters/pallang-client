'use client'

import { useMutation } from '@tanstack/react-query'
import { type SubmitEvent, useEffect, useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textfield } from '@/app/_global/_components/Textfield/Textfield'
import { ApiError } from '@/app/_global/_data/api.model'
import { bookMutations } from '@/app/_global/_queries/book.queries'

import {
  type BookFormField,
  type BookFormValues,
  isValidBookForm,
  toCreateBookInput,
  validateBookForm,
} from '../../_services/bookForm.service'
import { fetchCoverImageBlob } from '../../_services/coverImage.service'
import type { SelectedBook } from '../../_types/traceDraft.type'

type BookAddFormProps = {
  /** 알라딘에서 고른 책의 표지. 미리보기로 쓰고, 등록 시 프록시로 받아 coverImage 파일로 함께 올린다. */
  coverImageUrl: null | string
  /** 저장하기 버튼이 시트의 footer 슬롯에서 이 id로 이 폼을 가리킨다(HTML `form` 속성). */
  formId: string
  initialValues: BookFormValues
  onCreated: (book: SelectedBook) => void
  /** 저장 버튼이 폼 밖(footer)에 있어 disabled 여부를 직접 볼 수 없다 — 바뀔 때마다 올려 보낸다. */
  onPendingChange: (pending: boolean) => void
}

type FieldSpec = {
  field: BookFormField
  label: string
  numeric?: boolean
  placeholder: string
  required: boolean
}

const FIELDS: FieldSpec[] = [
  { field: 'title', label: '제목', placeholder: '책 제목을 입력해 주세요.', required: true },
  { field: 'author', label: '지은이', placeholder: '책 지은이를 입력해 주세요.', required: true },
  {
    field: 'publisher',
    label: '출판사',
    placeholder: '책 출판사를 입력해 주세요.',
    required: true,
  },
  {
    field: 'pageCount',
    label: '페이지 수',
    numeric: true,
    placeholder: '책 페이지를 입력해 주세요.',
    required: true,
  },
  { field: 'isbn', label: 'ISBN', placeholder: 'ISBN을 입력해 주세요.', required: false },
]

const MAX_PAGE_DIGITS = 5

export function BookAddForm({
  coverImageUrl,
  formId,
  initialValues,
  onCreated,
  onPendingChange,
}: BookAddFormProps) {
  const [values, setValues] = useState<BookFormValues>(initialValues)
  // 처음부터 빨간 글씨를 띄우지 않는다. 저장을 눌러 막힌 뒤부터 보여준다.
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [message, setMessage] = useState('')
  // 표지 Blob을 받아오는 동안에도 저장 버튼이 잠겨야 한다 — mutation isPending보다 먼저 시작된다.
  const [isPreparingCover, setIsPreparingCover] = useState(false)
  const createBook = useMutation(bookMutations.create())

  const errors = isSubmitted ? validateBookForm(values) : {}
  const isPending = isPreparingCover || createBook.isPending

  useEffect(() => {
    onPendingChange(isPending)
  }, [isPending, onPendingChange])

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitted(true)
    if (!isValidBookForm(values)) return

    // 표지는 부가 정보 — 못 받아오면(차단·형식 불일치 등) 표지 없이 등록을 계속한다.
    setIsPreparingCover(true)
    const coverImage = coverImageUrl ? await fetchCoverImageBlob(coverImageUrl) : null
    setIsPreparingCover(false)

    createBook.mutate(
      { book: toCreateBookInput(values), ...(coverImage ? { coverImage } : {}) },
      {
        onSuccess: (response) => {
          const created = response.data
          if (!created) {
            setMessage('책을 등록하지 못했어요. 잠시 후 다시 시도해주세요.')
            return
          }
          onCreated({
            bookId: created.bookId,
            title: created.title,
            author: created.author,
            coverImageUrl: created.coverImageUrl ?? null,
            pageCount: created.pageCount,
          })
        },
        onError: (error) => {
          // 서버는 ISBN 중복을 막지 않는다(#110). 400은 값 형식이 맞지 않을 때라
          // 다시 눌러도 결과가 같으니 입력을 고치도록 안내한다.
          if (error instanceof ApiError && error.status === 400) {
            setMessage('입력한 정보를 다시 확인해주세요.')
            return
          }
          setMessage('책을 등록하지 못했어요. 잠시 후 다시 시도해주세요.')
        },
      },
    )
  }

  return (
    // 시트 본문으로 얹히는 조각이다 — 헤더·safe-area·스크롤은 감싸는 시트(BookSearchSheet)가
    // 갖는다. 저장 버튼은 이 화면 안에 없다 — 시트의 footer 슬롯(스크롤에 딸려 올라가지 않는
    // 고정 영역)에서 이 <form id={formId}>를 HTML form 속성으로 가리켜 제출한다.
    <>
      <form id={formId} onSubmit={(event) => void handleSubmit(event)}>
        {/* Figma 2260:9671 — 표지 자리. 알라딘 표지가 있을 때만 채워지고, 등록 시 파일로 함께 올라간다. */}
        <div className="flex shrink-0 items-center justify-center px-4 py-3.5">
          <div className="h-[120px] w-20 shrink-0 overflow-hidden rounded-[2px] border border-border-book bg-bg-surface shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
              <img src={coverImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <p className="flex size-full items-center justify-center px-1 text-center text-body-14md text-text-secondary">
                책 이미지를
                <br />
                등록해주세요
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-6">
          {FIELDS.map(({ field, label, numeric, placeholder, required }) => (
            <Textfield
              key={field}
              label={label}
              required={required}
              placeholder={placeholder}
              inputMode={numeric ? 'numeric' : undefined}
              maxLength={numeric ? MAX_PAGE_DIGITS : undefined}
              value={values[field]}
              errorMessage={errors[field]}
              onChange={(event) => {
                const next = numeric
                  ? event.target.value.replace(/[^0-9]/g, '').slice(0, MAX_PAGE_DIGITS)
                  : event.target.value
                setValues((prev) => ({ ...prev, [field]: next }))
              }}
            />
          ))}
        </div>
      </form>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </>
  )
}
