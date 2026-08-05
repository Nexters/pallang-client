import { type NextRequest, NextResponse } from 'next/server'

import { isAllowedCoverUrl } from './coverHost.service'

// GET /api/book-cover?url=<알라딘 표지 URL>
// 도서 직접 등록이 multipart(coverImage 파일)로 바뀌면서 표지 URL을 서버에 넘길 수 없게 됐다.
// 브라우저에서 알라딘 이미지를 직접 fetch하면 CORS로 막히므로, 서버가 대신 받아 바이트를 돌려준다.
// 허용 호스트는 coverHost.service가 잠근다(SSRF 방지).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get('url')
  if (!url || !isAllowedCoverUrl(url)) {
    return NextResponse.json({ message: '허용되지 않은 표지 URL' }, { status: 400 })
  }

  const coverRes = await fetch(url).catch(() => null)
  if (!coverRes?.ok || !coverRes.body) {
    return NextResponse.json({ message: '표지 다운로드 실패' }, { status: 502 })
  }

  // 등록 API가 jpeg/png만 받는다 — 다른 타입이면 표지 없이 등록하도록 실패시킨다.
  const contentType = coverRes.headers.get('content-type') ?? ''
  if (!/^image\/(jpeg|png)/.test(contentType)) {
    return NextResponse.json({ message: '지원하지 않는 이미지 형식' }, { status: 415 })
  }

  return new NextResponse(coverRes.body, {
    headers: {
      'Content-Type': contentType,
      // 같은 표지를 반복 등록해도 원본을 다시 받지 않도록 하루 캐시
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
