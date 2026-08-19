import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { consumeHomeCoachmarkPending } from '@/app/_shared/onboarding/_services/coachmarkPending.service'
import { hasSeenOnboarding } from '@/app/_shared/onboarding/_services/onboardingSeen.service'

import { OnboardingView } from '../_components/OnboardingView/OnboardingView'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
}))

// happy-dom에서 next/image 최적화 로더가 돌지 않아 일반 img로 대체한다
vi.mock('next/image', () => ({
  default: ({ priority, ...props }: { priority?: boolean; alt: string }) => {
    // priority는 next/image 전용 prop이라 DOM으로 흘리지 않는다
    void priority
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

function renderView() {
  render(
    <HardwareBackProvider>
      <OnboardingView />
    </HardwareBackProvider>,
  )
}

describe('온보딩 뷰', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    replace.mockClear()
  })

  it('첫 단계 인사 문구로 시작한다', () => {
    renderView()

    expect(screen.getByRole('heading', { name: /안녕하세요/ })).toBeDefined()
  })

  it('다음을 누르면 다음 단계 문구로 넘어간다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByRole('heading', { name: /사진을 통해 문장을 편하게/ })).toBeDefined()
  })

  // 전환 중 이전 단계가 DOM에 겹쳐 남으므로, 보조기술에는 현재 단계만 보여야 한다
  it('다음을 누르면 이전 단계 문구는 접근성 트리에서 숨겨진다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.queryByRole('heading', { name: /안녕하세요/ })).toBeNull()
  })

  it('건너뛰기를 누르면 본 것으로 기록하고 홈으로 돌아간다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(hasSeenOnboarding()).toBe(true)
    expect(replace).toHaveBeenCalledWith('/')
  })

  it('마지막 단계에서 시작하기를 누르면 본 것으로 기록하고 홈으로 돌아간다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.queryByRole('button', { name: '건너뛰기' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }))

    expect(hasSeenOnboarding()).toBe(true)
    expect(replace).toHaveBeenCalledWith('/')
  })

  // 홈 사용법은 온보딩을 막 끝냈을 때만 안내한다 — 건너뛰기로 나가도 마찬가지다
  it('온보딩을 마치면 홈 코치마크를 예약한다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(consumeHomeCoachmarkPending()).toBe(true)
  })
})
