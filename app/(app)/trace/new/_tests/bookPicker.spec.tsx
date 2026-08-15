import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { BookPicker } from '../_components/BookPicker/BookPicker'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'

type CreatedBook = {
  author: string
  bookId: number
  coverImageUrl: null | string
  pageCount: number
  publisher: string
  source: string
  title: string
}

const { apiState } = vi.hoisted(() => ({
  apiState: {
    createResult: null as null | { data: CreatedBook },
    externalBooks: [] as unknown[],
    internalBooks: [] as unknown[],
  },
}))

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () => Promise.resolve({ data: { books: [] } }),
  searchExternalBooks: () => Promise.resolve({ data: { books: apiState.externalBooks } }),
  searchInternalBooks: () =>
    Promise.resolve({
      data: { books: apiState.internalBooks, pageInfo: { page: 0, hasNext: false } },
    }),
}))

vi.mock('@/app/_global/_apis/book.api', () => ({
  createBook: () => Promise.resolve(apiState.createResult),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

function renderPicker(seed?: TraceSeed) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <TraceDraftProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <BookPicker seed={seed} />
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceDraftProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

const SEED_BOOK = { bookId: 7, bookTitle: '모순', bookCoverImageUrl: null }
const SEED_PASSAGE = {
  passageId: 42,
  pageNumber: 122,
  quotedText: '문장이 오래 남았다',
  isSpoiler: false,
}

describe('BookPicker 씨앗 진입', () => {
  beforeEach(() => {
    replaceMock.mockClear()
  })

  it('꾸밈까지 담긴 대목으로 들어오면 의견 작성으로 바로 간다 — 꾸미기를 이어받아 건너뛴다', async () => {
    renderPicker({
      ...SEED_BOOK,
      passage: {
        ...SEED_PASSAGE,
        decorations: [{ startOffset: 0, endOffset: 2, effectType: 'WAVY', color: '#06D6A0' }],
      },
    })

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/opinion')
    })
  })

  it('꾸밈이 없는 대목이면 꾸미기부터 시작한다 — 의견 작성은 효과 하나를 요구한다', async () => {
    renderPicker({ ...SEED_BOOK, passage: { ...SEED_PASSAGE, decorations: [] } })

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/decorate')
    })
  })

  it('책만 담겨 오면(기록 남기기) 대목을 어떻게 남길지부터 묻는다', async () => {
    renderPicker({ ...SEED_BOOK, passage: null })

    expect(await screen.findByText('사진으로 입력')).toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})

describe('BookPicker 도서 추가', () => {
  beforeEach(() => {
    apiState.createResult = null
    apiState.externalBooks = []
    apiState.internalBooks = []
  })

  it('내부 결과가 없으면 알라딘 결과를 폴백으로 보여준다', async () => {
    apiState.externalBooks = [
      {
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        isbn: '9788936434120',
        coverImageUrl: 'https://image.aladin.co.kr/cover.jpg',
      },
    ]

    renderPicker()
    fireEvent.change(screen.getByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '채식주의자' },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('팔랑에 아직 없는 책')).toBeTruthy()
    })
    await waitFor(() => {
      expect(screen.getByText('채식주의자')).toBeTruthy()
    })
  })

  it('알라딘 결과를 고르면 폼이 채워진 채로 열린다', async () => {
    apiState.externalBooks = [
      {
        title: '채식주의자',
        author: '한강 (지은이), 김완희 (옮긴이)',
        publisher: '창비',
        isbn: '9788936434120',
        coverImageUrl: null,
      },
    ]

    renderPicker()
    fireEvent.change(screen.getByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '채식주의자' },
    })
    await waitFor(() => {
      expect(screen.getByText('채식주의자')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('채식주의자'))

    expect(screen.getByRole('heading', { name: '책 추가하기' })).toBeTruthy()
    expect(screen.getByLabelText(/제목/).getAttribute('value')).toBe('채식주의자')
    // 알라딘의 역할 표기('(지은이)', '(옮긴이)')는 떼고 지은이만 채운다
    expect(screen.getByLabelText(/지은이/).getAttribute('value')).toBe('한강')
    // 알라딘은 쪽수를 주지 않는다. 사용자가 직접 채워야 한다.
    expect(screen.getByLabelText(/페이지 수/).getAttribute('value')).toBe('')
  })

  it('필수 항목이 비면 저장이 막히고 안내가 뜬다', async () => {
    renderPicker()
    fireEvent.change(screen.getByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '없는책' },
    })
    fireEvent.click(await screen.findByRole('button', { name: '직접 추가하기' }))
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(screen.getByText('책 제목을 입력해 주세요.')).toBeTruthy()
    })
  })

  it('등록에 성공하면 대목 입력 방식을 묻는다', async () => {
    apiState.createResult = {
      data: {
        bookId: 7,
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        pageCount: 268,
        coverImageUrl: null,
        source: 'MANUAL',
      },
    }

    renderPicker()
    fireEvent.change(screen.getByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '없는책' },
    })
    fireEvent.click(await screen.findByRole('button', { name: '직접 추가하기' }))
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '채식주의자' } })
    fireEvent.change(screen.getByLabelText(/지은이/), { target: { value: '한강' } })
    fireEvent.change(screen.getByLabelText(/출판사/), { target: { value: '창비' } })
    fireEvent.change(screen.getByLabelText(/페이지 수/), { target: { value: '268' } })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(screen.getByText('새로운 흔적을 어떻게 남길까요?')).toBeTruthy()
    })
  })
})
