import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, customFetch, setAccessTokenGetter } from '@/app/_global/_apis/customFetch.api'

function mockFetch(response: Response) {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('customFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessTokenGetter(() => null)
  })

  it('200 응답이면 JSON body를 반환한다', async () => {
    mockFetch(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
    await expect(customFetch<{ id: number }>('/api/books', { method: 'GET' })).resolves.toEqual({
      id: 1,
    })
  })

  it('토큰 getter가 설정되면 Authorization 헤더를 붙인다', async () => {
    const spy = mockFetch(new Response('{}', { status: 200 }))
    setAccessTokenGetter(() => 'token-123')
    await customFetch('/api/books', { method: 'GET' })
    const headers = new Headers((spy.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('에러 응답이면 ErrorResponse를 담은 ApiError를 던진다', async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          type: '/api/books',
          title: 'BOOK_404_1',
          status: 404,
          detail: '해당 도서를 찾을 수 없습니다.',
        }),
        { status: 404 },
      ),
    )
    const error = await customFetch('/api/books/1', { method: 'GET' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 404,
      code: 'BOOK_404_1',
      message: '해당 도서를 찾을 수 없습니다.',
    })
  })

  it('에러 body가 JSON이 아니면 HTTP 상태 기반 fallback을 쓴다', async () => {
    mockFetch(new Response('oops', { status: 500, statusText: 'Internal Server Error' }))
    const error = await customFetch('/api/books', { method: 'GET' }).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 500, code: 'HTTP_500' })
  })
})
