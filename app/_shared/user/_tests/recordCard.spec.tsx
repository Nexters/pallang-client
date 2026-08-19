import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RecordCard } from '../_components/RecordCard/RecordCard'

/** 본문 한 줄에 들어가는 글자 수와 줄 높이 — 실제 값이 아니라 넘침을 만들기 위한 눈금이다 */
const CHARS_PER_LINE = 30
const LINE_HEIGHT = 24
/** 접힌 본문은 세 줄까지만 보인다 */
const CLAMPED_HEIGHT = LINE_HEIGHT * 3

/**
 * happy-dom에는 레이아웃 엔진이 없어 `scrollHeight`/`clientHeight`가 언제나 0이고
 * `ResizeObserver`도 콜백을 부르지 않는다 — 그대로 두면 넘침 판정이 아예 일어나지 않는다.
 * 글자 수로 높이를 흉내 내고, observe() 시점에 콜백을 한 번 불러 브라우저의 최초 통지를 대신한다.
 */
function stubLayout() {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return Math.ceil(this.textContent.length / CHARS_PER_LINE) * LINE_HEIGHT
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    // 펼친 뒤에는 line-clamp가 풀려 잘리는 높이가 사라진다
    return this.className.includes('line-clamp-3') ? CLAMPED_HEIGHT : this.scrollHeight
  })

  vi.stubGlobal(
    'ResizeObserver',
    class {
      unobserve = vi.fn()
      disconnect = vi.fn()
      constructor(private readonly callback: () => void) {}
      /** observe()가 최초 한 번을 바로 물어다 주는 브라우저 동작을 흉내 낸다 */
      observe() {
        this.callback()
      }
    },
  )
}

function renderCard(body: string) {
  stubLayout()
  render(<RecordCard pageNumber={128} meta="밤샘낭독가" body={body} />)
}

const SHORT_BODY = '술술 읽혔습니다.'
const LONG_BODY = Array.from(
  { length: 4 },
  () => '두꺼운 책을 멀리한지 꽤 되어서 걱정됬는데, 걱정이 무색할 정도로 술술 읽혔습니다.',
).join(' ')

describe('관리 목록 카드', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('머리줄에 쪽수와 보조 텍스트를 나란히 보여준다', () => {
    renderCard(SHORT_BODY)

    expect(screen.getByText('128p')).toBeInTheDocument()
    expect(screen.getByText('밤샘낭독가')).toBeInTheDocument()
  })

  it('본문이 세 줄을 넘으면 더보기가 뜬다', () => {
    renderCard(LONG_BODY)

    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument()
  })

  it('세 줄에 들어가는 본문에는 더보기가 뜨지 않는다', () => {
    renderCard(SHORT_BODY)

    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument()
  })

  it('더보기를 누르면 본문이 펼쳐지고 더보기는 사라진다', async () => {
    renderCard(LONG_BODY)

    await userEvent.click(screen.getByRole('button', { name: '더보기' }))

    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument()
    expect(screen.getByText(LONG_BODY)).not.toHaveClass('line-clamp-3')
  })
})
