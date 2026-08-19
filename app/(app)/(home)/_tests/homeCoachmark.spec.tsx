import { act, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { COACHMARK_TARGET } from '@/app/_global/_data/coachmarkTarget.constant'
import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { markHomeCoachmarkPending } from '@/app/_shared/onboarding/_services/coachmarkPending.service'

import { HomeCoachmark } from '../_components/HomeCoachmark/HomeCoachmark'

// 코치마크는 홈의 실제 엘리먼트를 찾아 비춘다 — 마커만 세워 두면 좌표가 0이어도 단계는 돈다
function renderCoachmark() {
  return render(
    <HardwareBackProvider>
      <div data-coachmark={COACHMARK_TARGET.traceCreate} />
      <div data-coachmark={COACHMARK_TARGET.homeActiveBook} />
      <div data-coachmark={COACHMARK_TARGET.bookExplore} />
      <HomeCoachmark />
    </HardwareBackProvider>,
  )
}

// 예약 판정은 effect에서 읽고 여는 것은 다음 틱으로 미룬다 — 그 틱을 흘려보낸다
async function flushOpenTimer() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
  })
}

describe('홈 코치마크', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('그냥 홈에 들어온 것만으로는 뜨지 않는다', async () => {
    renderCoachmark()
    await flushOpenTimer()

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('온보딩을 끝내고 홈에 도착하면 첫 단계부터 뜬다', async () => {
    markHomeCoachmarkPending()

    renderCoachmark()
    await flushOpenTimer()

    expect(screen.getByRole('dialog')).toHaveAccessibleName('홈 사용법 안내')
    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.getByText(/\+ 버튼을 클릭 해/)).toBeInTheDocument()
  })

  it('다음을 누르면 단계가 넘어가고 마지막 단계에서는 확인으로 바뀐다', async () => {
    markHomeCoachmarkPending()
    renderCoachmark()
    await flushOpenTimer()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByText(/내가 남긴 책들은 메인에서/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(screen.getByText(/내가 남긴 책 외의 모든 책들은/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음' })).toBeNull()
  })

  it('마지막 단계에서 확인을 누르면 닫힌다', async () => {
    markHomeCoachmarkPending()
    renderCoachmark()
    await flushOpenTimer()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  // 예약은 읽는 순간 지워진다 — 안 그러면 홈에 들어올 때마다 안내가 다시 뜬다
  it('한 번 뜬 뒤에는 홈에 다시 들어와도 뜨지 않는다', async () => {
    markHomeCoachmarkPending()
    const { unmount } = renderCoachmark()
    await flushOpenTimer()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    unmount()

    renderCoachmark()
    await flushOpenTimer()

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
