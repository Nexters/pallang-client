// 표지 프록시가 가져올 수 있는 원본 호스트 검증.
// 임의 URL을 서버가 대신 fetch하면 SSRF(내부망 접근) 통로가 되므로,
// 외부 도서 검색이 표지를 주는 이미지 도메인만 허용한다.
// - 카카오 책 검색: search1 CDN의 썸네일 프록시 URL (서버가 알라딘에서 카카오로 교체)
// - 알라딘: 교체 전에 저장된 표지 URL
const ALLOWED_COVER_HOST_PATTERN = /(^|\.)aladin\.co\.kr$|^search1\.kakaocdn\.net$/

export function isAllowedCoverUrl(rawUrl: string): boolean {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }
  return url.protocol === 'https:' && ALLOWED_COVER_HOST_PATTERN.test(url.hostname)
}
