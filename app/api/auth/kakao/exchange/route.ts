import { type NextRequest, NextResponse } from 'next/server'

import { KAKAO_STATE_COOKIE, KAKAO_TOKEN_URL } from '@/app/_global/_data/auth.constant'

type ExchangeBody = {
  code?: string
  redirectUri?: string
  state?: string
}

type KakaoTokenResponse = {
  access_token?: string
  error?: string
  error_code?: string
  error_description?: string
}

// POST /api/auth/kakao/exchange
// 카카오 인가 code를 서버-투-서버로 카카오 액세스 토큰으로 교환한다.
// 브라우저에서 직접 kauth를 부르면 CORS로 막히고 REST 키가 노출되므로 이 경로가 필요하다.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const restApiKey = process.env['KAKAO_REST_API_KEY']
  if (!restApiKey) {
    return NextResponse.json({ message: 'KAKAO_REST_API_KEY 미설정' }, { status: 500 })
  }

  const body = (await request.json().catch(() => null)) as ExchangeBody | null
  if (!body?.code || !body.redirectUri) {
    return NextResponse.json({ message: 'code/redirectUri 누락' }, { status: 400 })
  }

  // CSRF: authorize 때 심은 state 쿠키와 콜백이 돌려준 state가 일치해야 한다.
  const cookieState = request.cookies.get(KAKAO_STATE_COOKIE)?.value
  if (!cookieState || cookieState !== body.state) {
    return NextResponse.json({ message: 'state 불일치' }, { status: 400 })
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: restApiKey,
    redirect_uri: body.redirectUri,
    code: body.code,
  })
  const clientSecret = process.env['KAKAO_CLIENT_SECRET']
  if (clientSecret) params.set('client_secret', clientSecret)

  const kakaoRes = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: params.toString(),
  })
  const token = (await kakaoRes.json().catch(() => null)) as KakaoTokenResponse | null

  if (!kakaoRes.ok || !token?.access_token) {
    // 디버깅: 카카오가 돌려준 에러 코드/설명을 서버 로그와 응답에 남긴다.
    console.error('카카오 토큰 교환 실패', {
      status: kakaoRes.status,
      error: token?.error,
      error_code: token?.error_code,
      error_description: token?.error_description,
      redirectUri: body.redirectUri,
    })
    return NextResponse.json(
      {
        message: token?.error_description ?? '카카오 토큰 교환 실패',
        error: token?.error,
        error_code: token?.error_code,
      },
      { status: 401 },
    )
  }

  const response = NextResponse.json({ kakaoAccessToken: token.access_token })
  response.cookies.delete(KAKAO_STATE_COOKIE)
  return response
}
