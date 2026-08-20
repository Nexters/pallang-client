import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  // API 프록시. 브라우저는 항상 /api/*를 같은 origin으로 부르고 Next 서버가 대신 백엔드를 호출한다.
  // 백엔드가 localhost:3000 외 오리진에 CORS를 안 열어줘서, 웹뷰(오리진이 LAN IP나 배포 도메인)의
  // 클라이언트 fetch가 전부 죽는 문제를 오리진 무관하게 없앤다(customFetch.getBaseUrl 참고).
  // (백엔드 API 경로는 모두 /api/*. 로컬 /api route handler(카카오 웹 로그인)는 filesystem 우선이라 rewrite보다 먼저 매칭된다.)
  rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    if (!apiOrigin) return Promise.resolve([])
    return Promise.resolve([{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }])
  },
  // Capacitor 셸이 원격 URL을 로드해 정적 자산이 앱 실행마다 네트워크를 탄다.
  // public/ 자산은 빌드 해시가 없어 기본으로는 장기 캐시를 못 받으므로 직접 immutable을 준다.
  // 전제: 이 경로들의 파일은 내용이 바뀌면 파일명도 바꾼다(예: -v2 접미사). 같은 이름으로
  // 내용만 갈아끼우면 1년간 옛 파일이 보인다. (meta_og.png 교체 시에도 파일명 변경 필수)
  headers() {
    const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
    return Promise.resolve([{ source: '/images/:path*', headers: immutable }])
  },
  images: {
    // svg.d.ts의 SVGR 타입 선언과 충돌하는 기본 '*.svg' 타입(any) 주입을 막는다
    disableStaticImages: true,
    // 표지 이미지의 원본 호스트. 실제 데이터(GET /api/books/*)의 coverImageUrl은
    // 알라딘 CDN(외부 검색 도서)과 API 서버(/images/book-covers/*, 직접 업로드 도서) 둘뿐이다.
    // API 서버는 배포 환경마다 도메인이 달라(dev/prod) 둘 다 등록한다.
    // 프로필 이미지는 도메인이 유동적이라(카카오 CDN 등) next/image 대상에서 제외한다 — raw <img> 유지.
    remotePatterns: [
      { protocol: 'https', hostname: 'image.aladin.co.kr', pathname: '/product/**' },
      { protocol: 'https', hostname: 'api.pallang.co.kr', pathname: '/images/**' },
      { protocol: 'https', hostname: 'api-dev.pallang.co.kr', pathname: '/images/**' },
    ],
    // AVIF 우선, 미지원 브라우저는 WebP 폴백. 포맷별로 캐시가 따로 쌓이는 비용은
    // 표지·프로필처럼 반복 조회되는 이미지라 절감 폭(약 20%)이 더 크다고 판단.
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              // 아이콘 기본 색 — className 전달 시 {...props}가 뒤에 스프레드되어 오버라이드됨
              svgProps: { className: 'text-icon-primary' },
              // SVGO로 인라인 SVG를 경량화한다(effect-wave 28.7KB 등이 JS 청크에 통째로 들어간다).
              // 단 removeViewBox만 끈다 — viewBox가 없으면 width/height 재정의 시 스케일이 안 되고 잘린다.
              // prefixIds 필수 — svgoConfig를 직접 주면 SVGR 기본 플러그인이 통째로 대체된다.
              // preset-default의 cleanupIds가 id를 파일별로 'a'로 축약하는데, 인라인 SVG의 <use href="#a">는
              // 문서 전체에서 첫 id를 집으므로 여러 아이콘이 한 화면에 뜨면(EffectPicker) 남의 도형을 그린다.
              svgo: true,
              svgoConfig: {
                plugins: [
                  { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
                  'prefixIds',
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
