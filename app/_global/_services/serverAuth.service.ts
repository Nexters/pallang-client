// 서버(SSR) 전용 — 요청 쿠키의 accessToken을 fetch 옵션으로 바꿔준다.
// customFetch의 setAccessTokenGetter는 모듈 싱글턴이라 서버에서 덮어쓰면 동시 요청끼리 토큰이 섞인다.
// 대신 orval이 이미 받는 options(RequestInit)에 Authorization을 실어 요청 스코프로 주입한다.
// (customFetch는 options.headers를 먼저 깔고 getAccessToken()이 있을 때만 덮어쓰므로 서버에서는 이 헤더가 그대로 나간다)

import { cookies } from 'next/headers'

import { ACCESS_TOKEN_KEY } from '@/app/_global/_data/auth.constant'

/**
 * 쿠키가 없으면 빈 옵션을 돌려준다 — 첫 방문·비인증(쿠키는 클라이언트 JS가 심는다)에서도
 * 프리페치는 그대로 진행하고(soft auth 엔드포인트), 인증이 필요한 값은 클라이언트가 다시 채운다.
 */
export async function getServerFetchOptions(): Promise<RequestInit> {
  const token = (await cookies()).get(ACCESS_TOKEN_KEY)?.value
  if (!token) return {}
  return { headers: { Authorization: `Bearer ${token}` } }
}
