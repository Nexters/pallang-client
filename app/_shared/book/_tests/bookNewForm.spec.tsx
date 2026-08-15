import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BookNewForm, type BookNewFormStatus } from '../_components/BookNewForm/BookNewForm'

// 도서 등록은 multipart라 생성물이 아니라 손으로 쓴 book.api에 산다(#211).
const { createBookMock } = vi.hoisted(() => ({ createBookMock: vi.fn() }))
vi.mock('@/app/_global/_apis/book.api', () => ({ createBook: createBookMock }))

const CREATED = {
  data: {
    author: '지은이',
    bookId: 99,
    coverImageUrl: null,
    pageCount: 100,
    publisher: '출판사',
    source: 'INTERNAL',
    title: '새 책',
  },
}

const ALADIN_COVER = 'https://image.aladin.co.kr/product/cover.jpg'

/**
 * 저장하기 버튼은 폼 밖에 산다(지면은 고정 하단, 시트는 footer 슬롯).
 * 두 지면이 공유하는 그 배선을 그대로 흉내 낸다 — form 속성 + onStatusChange로 받은 disabled.
 */
function FormHarness({
  initialCoverImageUrl,
  onCreated,
}: {
  initialCoverImageUrl?: null | string
  onCreated: (book: { bookId: number; title: string }) => void
}) {
  const [status, setStatus] = useState<BookNewFormStatus>({ canSubmit: false, isPending: false })

  return (
    <>
      <BookNewForm
        formId="book-new-form"
        initialCoverImageUrl={initialCoverImageUrl}
        onCreated={onCreated}
        onStatusChange={setStatus}
      />
      <button type="submit" form="book-new-form" disabled={!status.canSubmit}>
        저장하기
      </button>
    </>
  )
}

function renderForm({ initialCoverImageUrl }: { initialCoverImageUrl?: null | string } = {}) {
  const onCreated = vi.fn()
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <FormHarness initialCoverImageUrl={initialCoverImageUrl} onCreated={onCreated} />
    </QueryClientProvider>,
  )
  return { onCreated }
}

function fillRequiredFields() {
  fireEvent.change(screen.getByRole('textbox', { name: '제목' }), { target: { value: '제목' } })
  fireEvent.change(screen.getByRole('textbox', { name: '지은이' }), { target: { value: '지은이' } })
  fireEvent.change(screen.getByRole('textbox', { name: '출판사' }), { target: { value: '출판사' } })
  fireEvent.change(screen.getByRole('textbox', { name: '페이지 수' }), { target: { value: '100' } })
}

function attachCoverFile() {
  const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('표지 파일 입력을 찾지 못했다')
  fireEvent.change(input, {
    target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
  })
}

describe('책 등록 폼', () => {
  beforeEach(() => {
    createBookMock.mockReset()
    createBookMock.mockResolvedValue(CREATED)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('표지가 없으면 필수 입력을 다 채워도 저장할 수 없다', () => {
    renderForm()

    fillRequiredFields()

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('기기에서 고른 표지를 파일로 함께 올린다', async () => {
    const { onCreated } = renderForm()

    fillRequiredFields()
    attachCoverFile()

    const saveButton = screen.getByRole('button', { name: '저장하기' })
    expect(saveButton).not.toBeDisabled()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({ bookId: 99, pageCount: 100, title: '새 책' }),
      )
    })
    const [payload] = createBookMock.mock.calls[0] as [{ coverImage?: Blob }]
    expect(payload.coverImage).toBeInstanceOf(File)
  })

  it('알라딘에서 고른 표지는 파일을 고르지 않아도 프록시로 받아 함께 올린다', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) })
    vi.stubGlobal('fetch', fetchMock)
    const { onCreated } = renderForm({ initialCoverImageUrl: ALADIN_COVER })

    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/book-cover?url=${encodeURIComponent(ALADIN_COVER)}`,
    )
    const [payload] = createBookMock.mock.calls[0] as [{ coverImage?: Blob }]
    expect(payload.coverImage).toBe(blob)
  })

  it('표지를 못 받아와도 등록 자체는 계속한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { onCreated } = renderForm({ initialCoverImageUrl: ALADIN_COVER })

    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled()
    })
    const [payload] = createBookMock.mock.calls[0] as [{ coverImage?: Blob }]
    expect(payload.coverImage).toBeUndefined()
  })
})
