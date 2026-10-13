// 알라딘 표지 URL의 크기 변형 세그먼트를 큰 슬롯용으로 치환한다.
//
// 검색으로 등록된 책의 coverImageUrl은 알라딘 cover200(폭 200px 썸네일) 변형으로 저장돼 있다.
// 큰 슬롯(홈 캐러셀 220 CSS px, 완료 화면 144 CSS px)은 DPR 2에서 각각 440px·288px 원본이
// 필요한데, next/image는 원본 이상으로 업스케일하지 않아 소스 변형 자체를 키워야 화질이 산다.
// cover500은 실제 폭 500px로 응답함을 실데이터(GET /api/books/popular 알라딘 표지 19건 전수)로
// 확인했다. 백엔드 저장 URL은 그대로 두고 표시 시점에만 치환한다.
//
// 알라딘 표지 URL(image.aladin.co.kr/product/.../cover200/...)이 아닌 것 —
// 직접 업로드 표지(*.pallang.co.kr/images/book-covers/*), 변형 세그먼트가 없는 URL,
// URL이 아닌 문자열 — 은 건드리지 않고 그대로 돌려준다.
const ALADIN_COVER_HOST = 'image.aladin.co.kr'
const ALADIN_COVER_PATH_PREFIX = '/product/'
const COVER_VARIANT_SEGMENT_PATTERN = /^cover\d+$/
const LARGE_COVER_VARIANT = 'cover500'

export function toLargeCoverUrl(coverImageUrl: string): string {
  let url: URL
  try {
    url = new URL(coverImageUrl)
  } catch {
    return coverImageUrl
  }

  if (url.hostname !== ALADIN_COVER_HOST) return coverImageUrl
  if (!url.pathname.startsWith(ALADIN_COVER_PATH_PREFIX)) return coverImageUrl

  const segments = url.pathname.split('/')
  const variantIndex = segments.findIndex((segment) => COVER_VARIANT_SEGMENT_PATTERN.test(segment))
  if (variantIndex === -1) return coverImageUrl

  segments[variantIndex] = LARGE_COVER_VARIANT
  url.pathname = segments.join('/')

  return url.toString()
}
