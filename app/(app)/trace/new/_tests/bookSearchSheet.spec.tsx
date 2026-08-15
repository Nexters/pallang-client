import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BookSearchSheet } from '../_components/BookSearchSheet/BookSearchSheet'
// 브리프의 원 파일 목록에는 없던 의존성이다 — useOverlayBackGuard(→useTraceOverlay)가
// TraceOverlayProvider 밖에서 던지는 문제를 테스트가 provider 없이 렌더해 놓쳤던 것을 리뷰에서
// 바로잡았다(Task 5의 ocrPermission.spec.tsx가 같은 문제를 이렇게 해결한 선례를 따른다).
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceOverlay } from '../_hooks/useTraceOverlay'

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
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
})
