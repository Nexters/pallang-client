'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textfield } from '@/app/_global/_components/Textfield/Textfield'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { ApiError } from '@/app/_global/_data/api.model'
import { bookMutations } from '@/app/_global/_queries/book.queries'

import {
  type BookFormField,
  emptyBookForm,
  isValidBookForm,
  toCreateBookInput,
} from '../../_services/bookForm.service'

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

export function BookNewPageView() {
  const router = useRouter()
  const [values, setValues] = useState(emptyBookForm)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<null | string>(null)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverImageUrlRef = useRef<null | string>(null)
  const createBook = useMutation(bookMutations.create())

  const canSubmit = isValidBookForm(values) && coverImage !== null

  useEffect(() => {
    return () => {
      if (coverImageUrlRef.current) URL.revokeObjectURL(coverImageUrlRef.current)
    }
  }, [])

  const handleCoverImageChange = (file: File | null) => {
    if (coverImageUrlRef.current) URL.revokeObjectURL(coverImageUrlRef.current)

    setCoverImage(file)
    if (!file) {
      coverImageUrlRef.current = null
      setCoverImageUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    coverImageUrlRef.current = nextUrl
    setCoverImageUrl(nextUrl)
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    createBook.mutate(
      { book: toCreateBookInput(values), coverImage },
      {
        onSuccess: (response) => {
          const created = response.data
          if (!created) {
            setMessage('책을 등록하지 못했어요. 잠시 후 다시 시도해주세요.')
            return
          }
          router.replace('/book/list')
        },
        onError: (error) => {
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
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title as="h1">책 추가하기</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action
          aria-label="닫기"
          onClick={() => {
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

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center justify-center px-4 py-3.5">
          <button
            type="button"
            aria-label="책 이미지 첨부"
            className="h-[120px] w-20 shrink-0 cursor-pointer overflow-hidden rounded-[2px] border border-border-book bg-bg-surface shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
            onClick={() => fileInputRef.current?.click()}
          >
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 사용자가 고른 blob URL은 next/image가 다루지 않는다
              <img src={coverImageUrl} alt="" className="size-full object-cover" />
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
      </div>

      <div className="mt-auto flex shrink-0 px-4 pt-4 pb-safe">
        <Button
          className="h-[54px] flex-1"
          disabled={!canSubmit}
          loading={createBook.isPending}
          onClick={handleSubmit}
        >
          저장하기
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </main>
  )
}
