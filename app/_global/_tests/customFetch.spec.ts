import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  customFetch,
  setAccessTokenGetter,
  setTokenRefresher,
} from '@/app/_global/_apis/customFetch.api'
import { ApiError } from '@/app/_global/_data/api.model'

function mockFetch(response: Response) {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('customFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessTokenGetter(() => null)
    setTokenRefresher(null)
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

  it('401 TOKEN_EXPIRED면 refresher로 토큰을 갱신하고 1회 재시도한다', async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ title: 'AUTH_401_2' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', spy)
    const refresher = vi.fn().mockResolvedValue('new-token')
    setTokenRefresher(refresher)

    await expect(customFetch('/api/books', { method: 'GET' })).resolves.toEqual({ ok: true })
    expect(refresher).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('인증 엔드포인트(/api/auth/*) 401은 refresh 재시도를 하지 않는다', async () => {
    const spy = mockFetch(new Response(JSON.stringify({ title: 'AUTH_401_2' }), { status: 401 }))
    const refresher = vi.fn().mockResolvedValue('new-token')
    setTokenRefresher(refresher)

    await expect(customFetch('/api/auth/refresh', { method: 'POST' })).rejects.toBeInstanceOf(
      ApiError,
    )
    expect(refresher).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('body가 FormData면 Content-Type을 설정하지 않는다', async () => {
    const spy = mockFetch(new Response('{}', { status: 200 }))
    const formData = new FormData()
    formData.append('image', new Blob(['x'], { type: 'image/png' }))

    await customFetch('/api/passages/ocr', { method: 'POST', body: formData })

    const headers = new Headers((spy.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('body가 JSON 문자열이면 Content-Type을 application/json으로 설정한다', async () => {
    const spy = mockFetch(new Response('{}', { status: 200 }))

    await customFetch('/api/opinions', { method: 'POST', body: JSON.stringify({ bookId: 1 }) })

    const headers = new Headers((spy.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })
})
