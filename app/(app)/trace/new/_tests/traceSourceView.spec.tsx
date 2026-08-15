import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceSourceView } from '../_components/TraceSourceView/TraceSourceView'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

function renderView(seed: Parameters<typeof TraceSourceView>[0]['seed'] = null) {
  return render(
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <TraceSourceView seed={seed} />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>,
  )
}

describe('흔적 작성 첫 화면', () => {
  it('진입하면 방식 선택 시트가 열려 있다', async () => {
    replaceMock.mockClear()
    renderView()

    expect(await screen.findByText('새로운 기록을 어떻게 남길까요?')).toBeTruthy()
    expect(screen.getByRole('button', { name: /사진으로 입력/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /직접 입력/ })).toBeTruthy()
  })

  it('책을 물고 들어오면 그 책을 시트에 보여준다', async () => {
    renderView({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null, passage: null })

    expect(await screen.findByText('지금 기록을 남기는 책')).toBeTruthy()
    expect(screen.getByText('모순')).toBeTruthy()
  })

  it('책이 없으면 배지를 감춘다', async () => {
    renderView()

    await screen.findByText('새로운 기록을 어떻게 남길까요?')
    expect(screen.queryByText('지금 기록을 남기는 책')).toBeNull()
  })

  it('사진으로 입력을 고르면 카메라 단계로 간다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /사진으로 입력/ }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/photo')
    })
  })

  it('직접 입력을 고르고 문장을 적어 제출하면 대목을 담아 작성 단계로 간다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /직접 입력/ }))

    const textarea = await screen.findByPlaceholderText('문장을 입력해주세요.')
    fireEvent.change(textarea, { target: { value: '흔적을 남깁니다' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
    })
  })

  it('직접 입력 시트를 닫으면 플로우를 벗어나지 않고 방식 선택 시트로 돌아온다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /직접 입력/ }))
    await screen.findByPlaceholderText('문장을 입력해주세요.')

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(await screen.findByText('새로운 기록을 어떻게 남길까요?')).toBeTruthy()
    expect(replaceMock).not.toHaveBeenCalledWith('/')
  })
})
