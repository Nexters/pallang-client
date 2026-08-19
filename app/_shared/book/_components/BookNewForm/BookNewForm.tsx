'use client'

import { useMutation } from '@tanstack/react-query'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textfield } from '@/app/_global/_components/Textfield/Textfield'
import { ApiError } from '@/app/_global/_data/api.model'
import { bookMutations } from '@/app/_global/_queries/book.queries'

import {
  type BookFormField,
  type BookFormValues,
  emptyBookForm,
  isValidBookForm,
  toCreateBookInput,
} from '../../_services/bookForm.service'
import { fetchCoverImageBlob } from '../../_services/coverImage.service'

/** 등록이 끝난 책. 흔적 작성이 그대로 초안의 책으로 받아쓴다. */
export type CreatedBook = {
  author: string
  bookId: number
  coverImageUrl: null | string
  pageCount: number
  title: string
}

export type BookNewFormStatus = {
  /** 필수 입력과 표지가 모두 갖춰졌는가. 저장 버튼의 disabled가 이 값을 본다. */
  canSubmit: boolean
  /** 표지 내려받기 + 등록 요청. 둘 다 저장 버튼을 잠근다. */
  isPending: boolean
}

type BookNewFormProps = {
  /**
   * 저장 버튼은 두 지면 모두에서 이 폼 바깥(스크롤에 딸려 올라가지 않는 고정 영역)에 산다 —
   * HTML `form` 속성으로 이 id를 가리켜 밖에서도 제출이 이어진다.
   */
  formId: string
  /** 알라딘에서 고른 책의 표지. 미리보기로 쓰고, 저장할 때 프록시로 받아 파일로 함께 올린다. */
  initialCoverImageUrl?: null | string
  /** 알라딘에서 고른 책의 서지 정보. 없으면 빈 폼으로 시작한다. */
  initialValues?: BookFormValues
  onCreated: (book: CreatedBook) => void
  /**
   * 저장 버튼이 폼 밖에 있어 상태를 직접 볼 수 없다 — 바뀔 때마다 올려 보낸다.
   * `useState`의 setter처럼 **매 렌더 같은 함수**를 넘겨야 한다(새 함수를 넘기면 effect가 계속 돈다).
   */
  onStatusChange: (status: BookNewFormStatus) => void
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
  { field: 'author', label: '지은이', placeholder: '지은이를 입력해 주세요.', required: true },
  {
    field: 'publisher',
    label: '출판사',
    placeholder: '출판사를 입력해 주세요.',
    required: true,
  },
  {
    field: 'pageCount',
    label: '페이지 수',
    numeric: true,
    placeholder: '페이지 수를 입력해주세요.',
    required: true,
  },
  { field: 'isbn', label: 'ISBN', placeholder: 'ISBN을 입력해 주세요.', required: false },
]

const MAX_PAGE_DIGITS = 5

/**
 * 책 등록 폼 — 도서 등록 지면(`/book/new`)과 흔적 작성 ③의 책 검색 시트가 같이 쓴다.
 * 헤더·저장 버튼·safe-area 같은 겉틀은 지면이 갖고, 이 컴포넌트는 폼 본문만 책임진다.
 */
export function BookNewForm({
  formId,
  initialCoverImageUrl = null,
  initialValues,
  onCreated,
  onStatusChange,
}: BookNewFormProps) {
  const [values, setValues] = useState<BookFormValues>(initialValues ?? emptyBookForm)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [pickedCoverUrl, setPickedCoverUrl] = useState<null | string>(null)
  const [message, setMessage] = useState('')
  // 표지 Blob을 받아오는 동안에도 저장 버튼이 잠겨야 한다 — mutation isPending보다 먼저 시작된다.
  const [isPreparingCover, setIsPreparingCover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pickedCoverUrlRef = useRef<null | string>(null)
  const createBook = useMutation(bookMutations.create())

  // 기기에서 고른 파일이 우선이고, 없으면 알라딘 표지를 그대로 쓴다.
  const previewUrl = pickedCoverUrl ?? initialCoverImageUrl
  const canSubmit = isValidBookForm(values) && previewUrl !== null
  const isPending = isPreparingCover || createBook.isPending

  useEffect(() => {
    onStatusChange({ canSubmit, isPending })
  }, [canSubmit, isPending, onStatusChange])

  useEffect(() => {
    return () => {
      if (pickedCoverUrlRef.current) URL.revokeObjectURL(pickedCoverUrlRef.current)
    }
  }, [])

  const handleCoverImageChange = (file: File | null) => {
    if (pickedCoverUrlRef.current) URL.revokeObjectURL(pickedCoverUrlRef.current)

    setCoverImage(file)
    if (!file) {
      pickedCoverUrlRef.current = null
      setPickedCoverUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    pickedCoverUrlRef.current = nextUrl
    setPickedCoverUrl(nextUrl)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || isPending) return

    // 기기에서 고른 파일이 없으면 알라딘 표지를 프록시로 받아 올린다.
    // 표지는 부가 정보 — 못 받아오면(차단·형식 불일치 등) 표지 없이 등록을 계속한다.
    let uploaded: Blob | null = coverImage
    if (!uploaded && initialCoverImageUrl) {
      setIsPreparingCover(true)
      uploaded = await fetchCoverImageBlob(initialCoverImageUrl)
      setIsPreparingCover(false)
    }

    createBook.mutate(
      { book: toCreateBookInput(values), ...(uploaded ? { coverImage: uploaded } : {}) },
      {
        onSuccess: (response) => {
          const created = response.data
          if (!created) {
            setMessage('책을 등록하지 못했어요. 잠시 후 다시 시도해주세요.')
            return
          }
          onCreated({
            author: created.author,
            bookId: created.bookId,
            coverImageUrl: created.coverImageUrl ?? null,
            pageCount: created.pageCount,
            title: created.title,
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
    <>
      <form id={formId} onSubmit={(event) => void handleSubmit(event)}>
        {/* 표지 자리. 눌러 기기에서 고르고, 알라딘에서 온 표지는 미리 채워져 있다. */}
        <div className="flex shrink-0 items-center justify-center px-4 py-3.5">
          <button
            type="button"
            aria-label="책 이미지 첨부"
            className="h-[120px] w-20 shrink-0 cursor-pointer overflow-hidden rounded-[2px] border border-border-book bg-bg-surface shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob URL과 외부 커버 도메인 모두 next/image가 다루지 않는다
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center gap-0.5 px-1 text-center text-body-14md text-text-secondary">
                <span>이미지</span>
                <span className="font-bold text-interactive-required">*</span>
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(event) => {
              handleCoverImageChange(event.target.files?.[0] ?? null)
              event.currentTarget.value = ''
            }}
          />
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
