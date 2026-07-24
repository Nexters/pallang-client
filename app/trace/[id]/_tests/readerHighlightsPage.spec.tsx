import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ReaderHighlightsPage from '../page'

describe('ReaderHighlightsPage', () => {
  it('비로그인 시 다른 페이지 탭을 누르면 로그인 유도 팝업이 뜨고, 로그인 후 이동한다', () => {
    render(<ReaderHighlightsPage />)

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    expect(screen.getByText('해당 페이지부터는 로그인해야 확인할 수 있어요!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))
    expect(
      screen.queryByText('해당 페이지부터는 로그인해야 확인할 수 있어요!'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
  })

  it('스포일러 하이라이트는 가림막을 먼저 보여주고, 누르면 내용을 보여준다', () => {
    render(<ReaderHighlightsPage />)

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    fireEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))

    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()
  })

  it('비로그인 시 댓글 입력은 로그인 유도 후 열린다', () => {
    render(<ReaderHighlightsPage />)

    fireEvent.click(screen.getByRole('button', { name: '흔적 남기기' }))
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    expect(screen.getByText('해당 페이지부터는 로그인해야 확인할 수 있어요!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()
  })

  it('정렬 버튼을 누르면 최신순과 좋아요순이 토글된다', () => {
    render(<ReaderHighlightsPage />)

    fireEvent.click(screen.getByRole('button', { name: '최신순' }))
    expect(screen.getByRole('button', { name: '좋아요순' })).toBeInTheDocument()
  })

  it('스포일러 의견은 마스킹되고, 첫 클릭에 해제만 된다', () => {
    render(<ReaderHighlightsPage />)
    const spoiler = screen.getByText(
      '결혼이란 결국 선택의 문제라는 말, 읽을 때마다 다르게 다가와요.',
    )

    expect(spoiler).toHaveClass('font-galmuri')
    fireEvent.click(spoiler)
    expect(spoiler).not.toHaveClass('font-galmuri')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('의견 클릭 시 상세 오버레이가 열리고 X로 닫힌다', () => {
    render(<ReaderHighlightsPage />)

    fireEvent.click(
      screen.getByText('이 문장에서 한참을 머물렀어요. 안진진의 마음이 그대로 전해지는 것 같아요.'),
    )
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })
    expect(within(dialog).getByText('밤의독서가')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByLabelText('닫기'))
    expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()
  })

  it('상세에서 다음 의견으로 이동할 수 있고, 첫 의견에서는 이전 버튼이 비활성화된다', () => {
    render(<ReaderHighlightsPage />)

    // 최신순 첫 번째 의견(책책책을읽자)을 연다
    fireEvent.click(screen.getByText(/책장 냄새가 이렇게 묘사될 수 있구나 싶었어요\. 헌책방에/))
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })

    expect(within(dialog).getByLabelText('이전 의견')).toBeDisabled()
    fireEvent.click(within(dialog).getByLabelText('다음 의견'))
    expect(within(dialog).getByText('밤의독서가')).toBeInTheDocument()
  })

  it('리스트를 스크롤하면 페이지 탭이 숨겨지고, 최상단 복귀 시 다시 보인다', () => {
    render(<ReaderHighlightsPage />)
    const list = screen.getByRole('list')

    fireEvent.scroll(list, { target: { scrollTop: 60 } })
    expect(screen.queryByRole('button', { name: '9p' })).not.toBeInTheDocument()

    fireEvent.scroll(list, { target: { scrollTop: 0 } })
    expect(screen.getByRole('button', { name: '9p' })).toBeInTheDocument()
  })
})
