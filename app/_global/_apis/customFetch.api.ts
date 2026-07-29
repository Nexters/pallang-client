// orval mutator — 생성된 fetch 함수가 이 함수를 경유한다.
import { ApiError } from '@/app/_global/_data/api.model'
import { TOKEN_EXPIRED_CODE } from '@/app/_global/_data/auth.constant'

type ErrorBody = {
  type?: string
  title?: string
  status?: number
  detail?: string
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

// dev 브라우저에서만 same-origin(next.config.ts의 /api/* rewrite 프록시)으로 호출한다.
// 개발 API 서버에 CORS 헤더가 없기 때문이다. 서버 사이드 fetch는 CORS 제약이 없고
// 절대 URL이 필요하므로 환경과 무관하게 API origin을 직접 호출한다.
function getBaseUrl() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') return ''
  return process.env.NEXT_PUBLIC_API_URL ?? ''
}

export async function customFetch<T>(
  url: string,
  options: RequestInit,
  isRetry = false,
): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const isFormData = options.body instanceof FormData
  if (options.body != null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${getBaseUrl()}${url}`, { ...options, headers })

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
