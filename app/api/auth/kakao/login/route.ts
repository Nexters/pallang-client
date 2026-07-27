import { NextResponse } from 'next/server'

import { KAKAO_AUTHORIZE_URL, KAKAO_CALLBACK_PATH, KAKAO_STATE_COOKIE } from '@/app/_global/_data/auth.constant'

// GET /api/auth/kakao/login
// 카카오 authorize로 302 리다이렉트한다. REST 키는 서버에만 두고, CSRF 방지를 위해 state를 쿠키로 남긴다.
export function GET(request: Request): NextResponse {
  const restApiKey = process.env['KAKAO_REST_API_KEY']
  if (!restApiKey) {
    return NextResponse.json({ message: 'KAKAO_REST_API_KEY 미설정' }, { status: 500 })
  }

  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const redirectUri = `${origin}${KAKAO_CALLBACK_PATH}`
  const state = globalThis.crypto.randomUUID()

  const authorizeUrl = new URL(KAKAO_AUTHORIZE_URL)
  authorizeUrl.searchParams.set('client_id', restApiKey)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(KAKAO_STATE_COOKIE, state, {
    httpOnly: true,
    // https일 때만 Secure. localhost(http) prod 빌드에서 쿠키가 저장 안 되는 문제 방지.
    secure: requestUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })
  return response
}
