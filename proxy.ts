import { type NextRequest, NextResponse } from 'next/server'

// /api/*는 next.config.ts의 rewrite로 백엔드에 프록시되는데, 백엔드 CORS 필터가
// 화이트리스트 밖 Origin(웹뷰 오리진 = LAN IP·배포 도메인)이 붙은 요청 자체를
// 403("Invalid CORS request")으로 거부한다. 서버 경유 호출은 CORS가 무의미하므로
// 백엔드로 가는 요청에서 Origin을 벗겨 화이트리스트와 무관하게 통과시킨다.
export function proxy(request: NextRequest) {
  // 로컬 route handler(카카오 웹 로그인)는 rewrite 대상이 아니므로 그대로 둔다
  if (request.nextUrl.pathname.startsWith('/api/auth/kakao/')) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.delete('origin')
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: '/api/:path*' }
