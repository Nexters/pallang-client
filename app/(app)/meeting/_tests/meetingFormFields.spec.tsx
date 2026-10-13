import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { MeetingForm } from '../_components/MeetingForm/MeetingForm'
import { emptyMeetingForm } from '../_services/meetingForm.service'
import type { MeetingFormValues } from '../_types/meetingForm.type'

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () => Promise.resolve({ data: { books: [] } }),
  searchBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))
vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
}))

function Harness({
  initial = emptyMeetingForm,
  bookLocked = false,
  minCapacity,
}: {
  initial?: MeetingFormValues
  bookLocked?: boolean
  minCapacity?: number
}) {
  const [values, setValues] = useState(initial)
  return (
    <>
      <MeetingForm
        formId="f"
        values={values}
        onChange={setValues}
        onSubmit={vi.fn()}
        bookLocked={bookLocked}
        minCapacity={minCapacity}
      />
      <output data-testid="values">{JSON.stringify(values)}</output>
    </>
  )
}

function renderForm(props?: Parameters<typeof Harness>[0]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <Harness {...props} />
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

const values = () => JSON.parse(screen.getByTestId('values').textContent) as MeetingFormValues

// base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다(마우스 입력 기준, Select.spec.tsx와 같은 이유).
// fireEvent.click 단발로는 hover·pointerdown이 없어 선택이 무시되므로 인원 필드만 userEvent로 조작한다.
const user = userEvent.setup()

describe('모임 폼', () => {
  it('라벨·별표·헬퍼·플레이스홀더가 시안 문구 그대로다', () => {
    renderForm()
    expect(screen.getByLabelText(/모임명/)).toHaveAttribute('placeholder', '모임명을 입력해주세요')
    expect(screen.getByText('최대 15자까지 가능해요.')).toBeInTheDocument()
    expect(screen.getByText('최대 10명까지 가능해요.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /모임에서 읽을 책을 선택해주세요./ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /시작일과 종료일을 선택해주세요./ }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('*')).toHaveLength(4) // 모임명·인원·책 선택·기간(FE 필수 결정)
  })
  it('모임명은 15자를 넘겨 입력할 수 없다', () => {
    renderForm()
    expect(screen.getByLabelText(/모임명/)).toHaveAttribute('maxlength', '15')
    fireEvent.change(screen.getByLabelText(/모임명/), { target: { value: '고전 뽀개기' } })
    expect(values().name).toBe('고전 뽀개기')
  })
  it('인원은 2명이 기본이고 현재 인원 미만은 고를 수 없다', async () => {
    renderForm({ minCapacity: 4, initial: { ...emptyMeetingForm, capacity: 4 } })
    await user.click(screen.getByRole('combobox', { name: '인원' }))
    const three = await screen.findByRole('option', { name: '3명' })
    expect(three).toHaveAttribute('aria-disabled', 'true')
    await user.click(await screen.findByRole('option', { name: '6명' }))
    expect(values().capacity).toBe(6)
  })
  it('책 선택 버튼은 책 선택하기 시트를 연다', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /모임에서 읽을 책을 선택해주세요./ }))
    expect(await screen.findByRole('heading', { name: '책 선택하기' })).toBeInTheDocument()
  })
  it('잠긴 책은 편집 버튼 없이 안내만 보여준다', () => {
    renderForm({
      bookLocked: true,
      initial: {
        ...emptyMeetingForm,
        book: { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: null },
      },
    })
    expect(screen.getByText('모순')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '편집하기' })).not.toBeInTheDocument()
    expect(screen.getByText('선택한 책은 변경할 수 없어요.')).toBeInTheDocument()
  })
  it('기간 시트 달력에서 시작일·종료일을 탭하면 필드에 점 표기로 보인다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 21))
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /시작일과 종료일을 선택해주세요./ }))
    fireEvent.click(await screen.findByRole('button', { name: '2026.08.20' }))
    expect(screen.getByText('2026.08.20 ~ 종료일을 선택해주세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '다음 달' }))
    fireEvent.click(screen.getByRole('button', { name: '2026.09.20' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(values()).toMatchObject({ startDate: '2026-08-20', endDate: '2026-09-20' })
    expect(screen.getByRole('button', { name: /2026.08.20 ~ 2026.09.20/ })).toBeInTheDocument()
    vi.useRealTimers()
  })
})
