// orval mutator — 생성된 fetch 함수가 이 함수를 경유한다.
import { TOKEN_EXPIRED_CODE } from '@/app/_global/_data/auth.constant'

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

// 앱 초기화 시(AuthProvider) initAuthSession에서 저장된 accessToken을 읽도록 연결한다.
// 미설정 시 Authorization 헤더 없이 요청한다.
let getAccessToken: AccessTokenGetter = () => null

export function setAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter
}

// 401(액세스 토큰 만료) 시 새 액세스 토큰을 발급해 반환한다. 실패하면 null.
// 순환 import를 피하려고 refresh 로직을 주입식으로 받는다(initAuthSession에서 연결).
type TokenRefresher = () => Promise<string | null>

let tokenRefresher: TokenRefresher | null = null

export function setTokenRefresher(refresher: TokenRefresher | null) {
  tokenRefresher = refresher
}

// 동시 401을 하나의 refresh로 합친다.
let refreshPromise: Promise<string | null> | null = null

function runRefresh(): Promise<string | null> {
  refreshPromise ??= (tokenRefresher?.() ?? Promise.resolve(null)).finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

// 인증 엔드포인트(/api/auth/*)는 refresh 재시도 대상에서 제외한다(refresh 자기 자신 무한루프 방지).
function isAuthPath(url: string): boolean {
  return url.startsWith('/api/auth/')
}

export async function customFetch<T>(
  url: string,
  options: RequestInit,
  isRetry = false,
): Promise<T> {
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

    if (
      res.status === 401 &&
      !isRetry &&
      !isAuthPath(url) &&
      body?.title === TOKEN_EXPIRED_CODE &&
      tokenRefresher
    ) {
      const newToken = await runRefresh()
      if (newToken) return customFetch<T>(url, options, true)
    }

    throw new ApiError(
      res.status,
      body?.title ?? `HTTP_${String(res.status)}`,
      body?.detail ?? res.statusText,
    )
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
