import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { TraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

import { TraceSeedBoundary } from '../_components/TraceSeedBoundary/TraceSeedBoundary'

const { navState } = vi.hoisted(() => ({ navState: { search: '' } }))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(navState.search),
}))

// 씨앗이 화면에 어떤 모양으로 도착하는지만 본다 — 씨앗을 소비하는 화면 동작은
// traceStepNavigation.spec이, 파서의 세부 규칙은 traceSeed.spec이 본다.
vi.mock('../_components/TraceSourceView/TraceSourceView', () => ({
  TraceSourceView: ({ seed }: { seed?: TraceSeed | null }) => (
    <output data-testid="seed-probe">{JSON.stringify(seed ?? null)}</output>
  ),
}))

function probeSeed(): unknown {
  return JSON.parse(screen.getByTestId('seed-probe').textContent)
}

/**
 * 씨앗은 클라이언트에서 읽어야 한다. 서버 경계(await searchParams)로 되돌리면 씨앗이 없는
 * 진입까지 매번 동적 RSC 왕복을 기다려 시트가 그만큼 늦게 뜬다(dev 콜드에서 +0.7~0.9초).
 * 이 스펙은 경계가 클라이언트 렌더 한 번으로 씨앗을 완성하는지를 잠근다 — 서버 컴포넌트로
 * 되돌아가면 클라이언트 render 자체가 성립하지 않아 여기서 깨진다.
 */
describe('TraceSeedBoundary', () => {
  it('쿼리가 없으면 씨앗 없이(null) 첫 화면을 그린다', () => {
    navState.search = ''
    render(<TraceSeedBoundary />)
    expect(probeSeed()).toBeNull()
  })

  it('URL 쿼리를 클라이언트에서 읽어 첫 렌더부터 씨앗을 넘긴다', () => {
    navState.search = 'bookId=7&bookTitle=파도&groupId=3'
    render(<TraceSeedBoundary />)
    expect(probeSeed()).toMatchObject({
      bookId: 7,
      bookTitle: '파도',
      groupId: 3,
      passage: null,
    })
  })
})
