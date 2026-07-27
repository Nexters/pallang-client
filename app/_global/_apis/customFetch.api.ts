// orval mutator — 생성된 fetch 함수가 이 함수를 경유한다.
type ErrorBody = {
  type?: string
  title?: string
  status?: number
  detail?: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type AccessTokenGetter = () => string | null

// TODO(auth): 카카오 로그인 구현 시 앱 초기화 지점에서 setAccessTokenGetter(() => 저장된 accessToken) 호출.
// 미설정 시 Authorization 헤더 없이 요청한다.
let getAccessToken: AccessTokenGetter = () => null

export function setAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter
}

export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const res = await fetch(`${baseUrl}${url}`, { ...options, headers })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null
    throw new ApiError(
      res.status,
      body?.title ?? `HTTP_${String(res.status)}`,
      body?.detail ?? res.statusText,
    )
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
