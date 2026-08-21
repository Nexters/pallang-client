import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { MyPageView } from '../_components/MyPageView/MyPageView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

const USER = { nickname: '밤샘낭독가', opinionCount: 125, profileImageUrl: null }

function renderLoggedIn() {
  render(
    <LoginGateProvider>
      <MyPageView user={USER} />
    </LoginGateProvider>,
  )
}

/** 제목이 같은 섹션이 둘이라 heading으로 좁혀 그 안의 항목만 읽는다 */
function itemsOf(sectionTitle: string) {
  const heading = screen.getByRole('heading', { name: sectionTitle })
  const section = heading.closest('section')
  if (!section) throw new Error(`${sectionTitle} 섹션을 찾지 못했다`)
  return within(section)
    .getAllByRole('listitem')
    .map((item) => item.textContent)
}

describe('마이페이지 항목 구성', () => {
  it('내 기록에는 내 서재만 둔다', () => {
    renderLoggedIn()

    expect(itemsOf('내 기록')).toEqual(['내 서재'])
    expect(screen.getByRole('link', { name: '내 서재' })).toHaveAttribute('href', '/my/library')
  })

  it('설정 항목이 시안 순서대로 놓인다', () => {
    renderLoggedIn()

    expect(itemsOf('설정')).toEqual([
      '공지사항',
      '스포일러 관리',
      '좋아요 관리',
      '차단 관리',
      '고객지원',
    ])
  })

  // 차단 유저 관리 화면은 확정 디자인으로 살아 있다 — 진입점을 빼면 갈 방법이 없어진다
  it('차단 관리로 가는 통로가 남아 있다', () => {
    renderLoggedIn()

    expect(screen.getByRole('link', { name: '차단 관리' })).toHaveAttribute('href', '/my/blocks')
  })

  // 갈 곳이 없는 항목을 목록에 두면 눌러도 아무 일이 없어 앱이 고장 난 것으로 읽힌다.
  // 비활성으로 잠가 두는 대신 아예 세우지 않는다 — 화면이 생기면 그때 항목을 추가한다.
  it('설정 항목은 모두 갈 곳이 있는 링크다', () => {
    renderLoggedIn()

    for (const label of itemsOf('설정')) {
      const item = screen.getByRole('link', { name: label })
      expect(item).toHaveAttribute('href')
      // chevron은 이동을 뜻한다 — 링크에는 언제나 붙는다
      expect(item.querySelector('[aria-hidden="true"]')).not.toBeNull()
    }
  })
})
