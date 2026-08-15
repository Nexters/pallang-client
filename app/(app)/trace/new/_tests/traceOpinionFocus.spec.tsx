import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOpinionForm } from '../_components/TraceOpinionForm/TraceOpinionForm'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/opinion',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))

/** 꾸밈까지 갖춘 초안으로 의견 작성 단계에 서 있게 한다 */
function Harness() {
  const { dispatch } = useTraceDraft()

  useEffect(() => {
    dispatch({
      type: 'selectBook',
      book: { bookId: 7, title: '모순', author: '', coverImageUrl: null, pageCount: null },
    })
    dispatch({ type: 'setQuotedText', quotedText: '문장이 오래 남았다' })
    dispatch({ type: 'setPageDetail', pageNumber: 122, isSpoiler: false })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'WAVY', color: '#06D6A0' },
    })
  }, [dispatch])

  return <TraceOpinionForm />
}

describe('의견 작성 단계', () => {
  it('열리자마자 입력창을 잡는다 — 흔적 보기의 의견 남기기가 곧장 이 자리로 보낸다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <HardwareBackProvider>
          <LoginGateProvider>
            <TraceDraftProvider>
              <TraceOverlayProvider>
                <TraceNavProvider>
                  <Harness />
                </TraceNavProvider>
              </TraceOverlayProvider>
            </TraceDraftProvider>
          </LoginGateProvider>
        </HardwareBackProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByPlaceholderText('의견을 작성해주세요.')).toHaveFocus()
  })
})
