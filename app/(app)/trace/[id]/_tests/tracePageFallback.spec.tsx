import { render, screen } from '@testing-library/react'
import { use } from 'react'
import { describe, expect, it, vi } from 'vitest'

import ReaderHighlightsPage from '../page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

// 서버 프리페치가 끝나지 않은 순간을 고정한다 — 이 상태에서 화면에 남는 것이 곧 사용자가 보는 로딩 화면이다
const pending = new Promise<void>(() => undefined)

vi.mock('../_components/TracePrefetchBoundary/TracePrefetchBoundary', () => ({
  TracePrefetchBoundary: () => {
    use(pending)
    return null
  },
}))

describe('흔적 페이지 로딩 화면', () => {
  // 셸에 실려 나가는 화면이 비어 있으면 직접 진입은 빈 화면이 뜨고, 링크 이동은 이전 화면이 멈춘 것처럼 보인다
  it('프리페치가 끝나기 전에도 화면에 골격이 남는다', () => {
    render(
      <ReaderHighlightsPage
        params={Promise.resolve({ id: '1' })}
        searchParams={Promise.resolve({})}
      />,
    )

    // 제목은 아직 도착 전이라 자리만 잡는다 — 헤더와 뒤로 가기는 실물이어야 한다
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
  })
})
