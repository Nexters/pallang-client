import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BookSearchSheet } from '../_components/BookSearchSheet/BookSearchSheet'
// 브리프의 원 파일 목록에는 없던 의존성이다 — useOverlayBackGuard(→useTraceOverlay)가
// TraceOverlayProvider 밖에서 던지는 문제를 테스트가 provider 없이 렌더해 놓쳤던 것을 리뷰에서
// 바로잡았다(Task 5의 ocrPermission.spec.tsx가 같은 문제를 이렇게 해결한 선례를 따른다).
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceOverlay } from '../_hooks/useTraceOverlay'

// 도서 직접 등록은 multipart라 생성물이 아니라 손으로 쓴 book.api에 산다(#211).
// 저장하기 footer 버튼(BookAddForm의 <form> 밖, HTML form 속성으로만 연결)이 실제로 그
// 폼을 제출하는지 검증하는 테스트가 이 응답의 data를 그대로 onSelect까지 흘려보낸다.
vi.mock('@/app/_global/_apis/book.api', () => ({
  createBook: () =>
    Promise.resolve({
      data: { bookId: 99, title: '새 책', author: '지은이', coverImageUrl: null, pageCount: 100 },
    }),
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchExternalBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

// 하드웨어 뒤로가기를 흉내 낸다 — traceOverlay.spec.tsx와 같은 프로브 패턴을 그대로 쓴다.
function BackProbe() {
  const overlay = useTraceOverlay()
  return (
    <button
      type="button"
      onClick={() => {
        overlay.closeTop()
      }}
    >
      하드웨어 뒤로가기
    </button>
  )
}

/** 등록 폼(BookNewForm)은 표지를 필수로 받는다 — 기기에서 고른 것처럼 파일을 넣는다. */
function attachCoverFile() {
  const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('표지 파일 입력을 찾지 못했다')
  fireEvent.change(input, {
    target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
  })
}

function renderSheet({ onClose = vi.fn(), onSelect = vi.fn() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <TraceOverlayProvider>
        <BackProbe />
        <BookSearchSheet open onClose={onClose} onSelect={onSelect} />
      </TraceOverlayProvider>
    </QueryClientProvider>,
  )
  return { onClose, onSelect }
}

describe('책 검색 시트', () => {
  it('시트 안에서 뒤로 버튼과 검색창을 보여준다', async () => {
    renderSheet()

    expect(await screen.findByRole('button', { name: '뒤로' })).toBeTruthy()
    expect(screen.getByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('책을 고르는 것만으로는 확정되지 않는다', async () => {
    const { onSelect } = renderSheet()

    fireEvent.click(await screen.findByText('모순'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('고른 뒤 등록하기를 눌러야 확정된다', async () => {
    const { onSelect } = renderSheet()

    fireEvent.click(await screen.findByText('모순'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bookId: 7, title: '모순' }))
  })

  it('아무것도 고르지 않으면 등록하기가 눌리지 않는다', async () => {
    renderSheet()

    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    expect(screen.getByRole('button', { name: '등록하기' }).hasAttribute('disabled')).toBe(true)
  })

  it('폼이 열린 채로 하드웨어 뒤로가기를 누르면 폼만 닫히고 시트는 유지된다', async () => {
    const { onClose } = renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '도서 추가' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    // 프로브 버튼은 시트(모달) 바깥의 형제라 base-ui가 aria-hidden 처리해 둔다 — 접근성 트리
    // 기준으로 찾는 getByRole은 hidden:true로 그 필터를 건너뛰어야 이 버튼을 찾는다.
    fireEvent.click(screen.getByRole('button', { name: '하드웨어 뒤로가기', hidden: true }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('폼을 열었다 닫아도 검색어가 그대로 남아 있다', async () => {
    renderSheet()

    const searchInput = await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    fireEvent.change(searchInput, { target: { value: '모순' } })
    expect(searchInput).toHaveValue('모순')

    fireEvent.click(screen.getByRole('button', { name: '도서 추가' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toHaveValue('모순')
  })

  it('도서 추가 폼의 저장하기 버튼이 시트의 고정 footer에 있다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '도서 추가' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    const saveButton = screen.getByRole('button', { name: '저장하기' })
    expect(saveButton.getAttribute('form')).toBeTruthy()
    expect(saveButton.closest('form')).toBeNull()
  })

  it('등록 폼이 아직 덜 찼으면 footer의 저장하기가 눌리지 않는다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '도서 추가' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('폼 밖에 있는 저장하기를 눌러도 폼이 실제로 제출된다', async () => {
    const { onSelect } = renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '도서 추가' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), { target: { value: '제목' } })
    fireEvent.change(screen.getByRole('textbox', { name: '지은이' }), {
      target: { value: '지은이' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '출판사' }), {
      target: { value: '출판사' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '페이지 수' }), {
      target: { value: '100' },
    })
    attachCoverFile()

    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bookId: 99, title: '새 책' }))
    })
  })
})
