// 토큰 저장소 — 메모리(동기 접근) + @capacitor/preferences(영속).
// @capacitor/preferences는 웹에서 localStorage로 폴백되므로 웹·앱 공통으로 동작한다.
// customFetch는 매 요청마다 동기로 액세스 토큰을 읽어야 하므로 메모리 캐시를 진실의 원천으로 두고,
// Preferences는 앱 재시작 후 hydrate 용도로만 쓴다.
// accessToken은 쿠키에도 미러링한다 — Next 서버(SSR)가 cookies()로 읽어 인증 fetch를 하기 위함.
// refreshToken은 쿠키에 넣지 않는다: ITP가 JS 쿠키 수명을 7일로 캡해서 주기적 강제 로그아웃이 난다.

import { Preferences } from '@capacitor/preferences'

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/app/_global/_data/auth.constant'

type Tokens = { accessToken: string; refreshToken: string }

let accessToken: string | null = null
let refreshToken: string | null = null

type Listener = () => void
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => {
    listener()
  })
}

// 저장/삭제/hydrate 때마다 재작성하므로 Max-Age 7일이면 충분하다(ITP 캡과 동일).
function syncAccessTokenCookie(token: string | null) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const value = token === null ? '; Max-Age=0' : `${token}; Max-Age=604800`
  document.cookie = `${ACCESS_TOKEN_KEY}=${value}; Path=/; SameSite=Lax${secure}`
}

// 로그인 상태 변화 구독(AuthProvider가 사용).
export function subscribeAuthTokens(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// customFetch가 동기로 읽는다.
export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return refreshToken
}

export function hasTokens(): boolean {
  return accessToken !== null
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
  syncAccessTokenCookie(tokens.accessToken)
  await Promise.all([
    Preferences.set({ key: ACCESS_TOKEN_KEY, value: tokens.accessToken }),
    Preferences.set({ key: REFRESH_TOKEN_KEY, value: tokens.refreshToken }),
  ])
  emit()
}

export async function clearTokens(): Promise<void> {
  accessToken = null
  refreshToken = null
  syncAccessTokenCookie(null)
  await Promise.all([
    Preferences.remove({ key: ACCESS_TOKEN_KEY }),
    Preferences.remove({ key: REFRESH_TOKEN_KEY }),
  ])
  emit()
}

// 앱 부팅 시 1회 호출. 영속 저장소 → 메모리로 복원한다.
export async function hydrateTokens(): Promise<void> {
  const [access, refresh] = await Promise.all([
    Preferences.get({ key: ACCESS_TOKEN_KEY }),
    Preferences.get({ key: REFRESH_TOKEN_KEY }),
  ])
  accessToken = access.value
  refreshToken = refresh.value
  syncAccessTokenCookie(access.value)
  emit()
}
