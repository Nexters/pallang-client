import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BookSearchSheet } from '../_components/BookSearchSheet/BookSearchSheet'

/** searchInternalBooks 응답의 책 한 권 — _apis를 직접 import하지 않고(no-restricted-imports)
 *  목의 반환 타입을 넓히기 위한 최소 모양이다. */
type MockSearchBook = {
  bookId: number
  title: string
  author: string
  publisher: string
  coverImageUrl: string | null
  pageCount: number | null
}

// vi.mock 팩토리는 import보다도 먼저(호이스팅되어) 실행된다 — 팩토리 안에서 참조할 목은
// vi.hoisted로 감싸야 "초기화 전 접근" 참조 오류 없이 값을 공유할 수 있다(traceBookForm.spec.tsx와
// 같은 선례). _apis를 직접 import하지 않고도(no-restricted-imports) 테스트에서 반환값을 갈아끼울 수 있다.
const { searchBooksMock, searchInternalBooksMock } = vi.hoisted(() => ({
  searchInternalBooksMock: vi.fn(
    (): Promise<{
      data: { books: MockSearchBook[]; pageInfo: { page: number; hasNext: boolean } }
    }> => Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
  ),
  // 통합(외부) 검색 — 내부 결과가 비어 있을 때만 불린다. 기본은 빈 목록이고,
  // 외부 후보 선택을 검증하는 케이스만 mockResolvedValue로 알라딘 결과를 채운다.
  searchBooksMock: vi.fn(
    (): Promise<{
      data: {
        books: {
          title: string
          author: string
          publisher: string
          coverImageUrl: string | null
          isbn: string | null
        }[]
      }
    }> => Promise.resolve({ data: { books: [] } }),
  ),
}))

// 도서 직접 등록은 multipart라 생성물이 아니라 손으로 쓴 book.api에 산다(#211).
// 저장하기 footer 버튼(BookAddForm의 <form> 밖, HTML form 속성으로만 연결)이 실제로 그
// 폼을 제출하는지 검증하는 테스트가 이 응답의 data를 그대로 onSelect까지 흘려보낸다.
vi.mock('@/app/_global/_apis/book.api', () => ({
  createBook: () =>
    Promise.resolve({
      data: { bookId: 99, title: '새 책', author: '지은이', coverImageUrl: null, pageCount: 100 },
    }),
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchBooks: searchBooksMock,
  // 기본은 빈 목록이다 — 검색 결과 리본을 검증하는 케이스만 mockResolvedValueOnce로 한 권을 채운다.
  searchInternalBooks: searchInternalBooksMock,
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

/** 등록된 닫기 핸들러를 들고 있다가 '하드웨어 뒤로가기' 버튼이 맨 위 것을 부른다 */
function createBackRegistry() {
  const stack: (() => void)[] = []
  return {
    register: (close: () => void) => {
      stack.push(close)
      return () => {
        const index = stack.indexOf(close)
        if (index >= 0) stack.splice(index, 1)
      }
    },
    closeTop: () => {
      stack.at(-1)?.()
    },
  }
}

/** 등록 폼(BookNewForm)은 표지를 필수로 받는다 — 기기에서 고른 것처럼 파일을 넣는다. */
function attachCoverFile() {
  const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('표지 파일 입력을 찾지 못했다')
  fireEvent.change(input, {
    target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
  })
}

function renderSheet({
  onClose = vi.fn(),
  onSelect = vi.fn(),
  title = '책 등록하기',
}: { onClose?: () => void; onSelect?: (book: unknown) => void; title?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const registry = createBackRegistry()
  render(
    <QueryClientProvider client={queryClient}>
      <button type="button" onClick={registry.closeTop}>
        하드웨어 뒤로가기
      </button>
      <BookSearchSheet
        open
        title={title}
        onClose={onClose}
        onRegisterBack={registry.register}
        onSelect={onSelect}
      />
    </QueryClientProvider>,
  )
  return { onClose, onSelect }
}

describe('책 등록 시트', () => {
  afterEach(() => {
    // mockResolvedValue로 채운 알라딘 결과가 다음 케이스로 새지 않게 한다(기본 빈 목록으로 복원).
    searchBooksMock.mockReset()
  })

  it('시트 안에서 뒤로 버튼과 검색창을 보여준다', async () => {
    renderSheet()

    expect(await screen.findByRole('button', { name: '뒤로' })).toBeTruthy()
    expect(screen.getByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('제목이 책 등록하기이고 검색창 옆에는 아무 버튼도 없다', async () => {
    // 검색바 옆 '도서 추가' 버튼은 시안에서 빠졌다 — 등록으로 가는 길은 footer 하나뿐이다.
    renderSheet()

    expect(await screen.findByText('책 등록하기')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '도서 추가' })).toBeNull()
  })

  it('title을 주면 헤더 제목이 바뀐다', () => {
    renderSheet({ title: '책 선택하기' })

    expect(screen.getByRole('heading', { name: '책 선택하기' })).toBeInTheDocument()
  })

  it('검색 전에도 새 책 등록하기로 등록 폼에 닿는다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))

    expect(await screen.findByText('책 추가하기')).toBeTruthy()
  })

  it('등록 폼이 열리면 새 책 등록하기 줄은 사라진다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))
    await screen.findByText('책 추가하기')

    expect(screen.queryByText(/찾는 책이 없나요/)).toBeNull()
  })

  it('책을 고르는 것만으로는 확정되지 않는다', async () => {
    const { onSelect } = renderSheet()

    fireEvent.click(await screen.findByText('모순'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('고른 뒤 등록하기를 눌러야 확정된다', async () => {
    const { onSelect } = renderSheet()

    fireEvent.click(await screen.findByText('모순'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bookId: 7, title: '모순' }))
  })

  it('아무것도 고르지 않으면 등록하기가 눌리지 않는다', async () => {
    renderSheet()

    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    expect(screen.getByRole('button', { name: '등록하기' }).hasAttribute('disabled')).toBe(true)
  })

  it('후보를 고르면 그 행에 "선택" 리본이 붙고 등록하기가 켜진다', async () => {
    searchInternalBooksMock.mockResolvedValueOnce({
      data: {
        books: [
          {
            bookId: 42,
            title: '여름',
            author: '김영하',
            publisher: '문학동네',
            coverImageUrl: null,
            pageCount: 200,
          },
        ],
        pageInfo: { page: 0, hasNext: false },
      },
    })
    renderSheet()

    fireEvent.change(await screen.findByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '여름' },
    })
    fireEvent.click(await screen.findByText('여름'))

    expect(screen.getByText('선택')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '등록하기' })).toBeEnabled()
  })

  it('캐러셀에서 고른 표지에도 선택 리본이 붙는다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByText('모순'))

    expect(screen.getByText('선택')).toBeInTheDocument()
  })

  it('외부 검색 결과를 골라도 폼으로 넘어가지 않고 선택 리본이 붙는다', async () => {
    searchBooksMock.mockResolvedValue({
      data: {
        books: [
          {
            title: '프랑켄슈타인',
            author: '메리 셸리',
            publisher: '문학동네',
            coverImageUrl: null,
            isbn: '9788954618373',
          },
        ],
      },
    })
    renderSheet()

    fireEvent.change(await screen.findByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '프랑켄슈타인' },
    })
    // 내부 검색이 빈 뒤에야 알라딘으로 넘어가므로 디바운스+쿼리 두 번을 기다린다
    fireEvent.click(await screen.findByText('프랑켄슈타인', {}, { timeout: 3000 }))

    expect(screen.getByText(/검색하신 책은 현재 팔랑에 남겨지지 않았어요/)).toBeInTheDocument()
    expect(screen.getByText(/오탈자인지 먼저 확인해주시고/)).toBeInTheDocument()
    expect(screen.queryByText('책 추가하기')).toBeNull()
    expect(screen.getByText('선택')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '등록하기' })).toBeEnabled()
  })

  it('외부 후보를 고르고 등록하기를 누르면 값이 채워진 도서 추가 폼이 열린다', async () => {
    searchBooksMock.mockResolvedValue({
      data: {
        books: [
          {
            title: '프랑켄슈타인',
            author: '메리 셸리',
            publisher: '문학동네',
            coverImageUrl: null,
            isbn: '9788954618373',
          },
        ],
      },
    })
    renderSheet()

    fireEvent.change(await screen.findByPlaceholderText('책 제목을 입력해 주세요.'), {
      target: { value: '프랑켄슈타인' },
    })
    fireEvent.click(await screen.findByText('프랑켄슈타인', {}, { timeout: 3000 }))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(await screen.findByText('책 추가하기')).toBeTruthy()
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('프랑켄슈타인')
    expect(screen.getByRole('textbox', { name: '지은이' })).toHaveValue('메리 셸리')
    expect(screen.getByRole('textbox', { name: '출판사' })).toHaveValue('문학동네')
  })

  it('폼이 열린 채로 하드웨어 뒤로가기를 누르면 폼만 닫히고 시트는 유지된다', async () => {
    const { onClose } = renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    // 프로브 버튼은 시트(모달) 바깥의 형제라 base-ui가 aria-hidden 처리해 둔다 — 접근성 트리
    // 기준으로 찾는 getByRole은 hidden:true로 그 필터를 건너뛰어야 이 버튼을 찾는다.
    fireEvent.click(screen.getByRole('button', { name: '하드웨어 뒤로가기', hidden: true }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('폼을 열었다 닫아도 검색어가 그대로 남아 있다', async () => {
    renderSheet()

    const searchInput = await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    fireEvent.change(searchInput, { target: { value: '모순' } })
    expect(searchInput).toHaveValue('모순')

    fireEvent.click(screen.getByRole('button', { name: '새 책 등록하기' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toHaveValue('모순')
  })

  it('새 책 등록 폼의 저장하기 버튼이 시트의 고정 footer에 있다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    const saveButton = screen.getByRole('button', { name: '저장하기' })
    expect(saveButton.getAttribute('form')).toBeTruthy()
    expect(saveButton.closest('form')).toBeNull()
  })

  it('등록 폼이 아직 덜 찼으면 footer의 저장하기가 눌리지 않는다', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('폼 밖에 있는 저장하기를 눌러도 폼이 실제로 제출된다', async () => {
    const { onSelect } = renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))
    expect(await screen.findByText('책 추가하기')).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), { target: { value: '제목' } })
    fireEvent.change(screen.getByRole('textbox', { name: '지은이' }), {
      target: { value: '지은이' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '출판사' }), {
      target: { value: '출판사' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '페이지 수' }), {
      target: { value: '100' },
    })
    attachCoverFile()

    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bookId: 99, title: '새 책' }))
    })
  })
})
