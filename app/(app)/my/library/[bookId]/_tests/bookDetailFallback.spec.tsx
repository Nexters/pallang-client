import { render, screen } from '@testing-library/react'
import { use } from 'react'
import { describe, expect, it, vi } from 'vitest'

import BookDetailPage from '../page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

// 요청 시점 경계가 끝나지 않은 순간을 고정한다 — 이 상태에서 화면에 남는 것이 곧 사용자가 보는 로딩 화면이다
const pending = new Promise<void>(() => undefined)

vi.mock('../_components/BookDetailBoundary/BookDetailBoundary', () => ({
  BookDetailBoundary: () => {
    use(pending)
    return null
  },
}))

describe('책 상세 로딩 화면', () => {
  it('데이터가 도착하기 전에도 셸과 골격이 남는다', () => {
    render(<BookDetailPage params={Promise.resolve({ bookId: '12' })} />)

    expect(screen.getByRole('heading', { name: '내 서재' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
  })

  // 실제 화면은 `편집` 알약을 늘 그린다 — 골격에 없으면 스트림이 도착하는 순간 우상단에서 튀어나온다
  it('골격도 실제 화면과 같은 자리에 편집 알약을 잡는다', () => {
    render(<BookDetailPage params={Promise.resolve({ bookId: '12' })} />)

    expect(screen.getByRole('button', { name: '편집' })).toBeDisabled()
  })
})
