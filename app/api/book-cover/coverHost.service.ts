// 표지 프록시가 가져올 수 있는 원본 호스트 검증.
// 임의 URL을 서버가 대신 fetch하면 SSRF(내부망 접근) 통로가 되므로,
// 외부 도서 검색이 표지를 주는 이미지 도메인만 허용한다.
// - 카카오 책 검색: Daum CDN 원본 표지(t1.daumcdn.net). 서버가 썸네일 대신 원본을 내려준다.
// - 카카오 책 검색 썸네일(search1 CDN): 원본으로 바꾸기 전에 저장·캐싱된 표지 URL
// - 알라딘: 카카오로 교체하기 전에 저장된 표지 URL
const ALLOWED_COVER_HOST_PATTERN =
  /(^|\.)aladin\.co\.kr$|^search1\.kakaocdn\.net$|^t1\.daumcdn\.net$/

export function isAllowedCoverUrl(rawUrl: string): boolean {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }
  return url.protocol === 'https:' && ALLOWED_COVER_HOST_PATTERN.test(url.hostname)
}
