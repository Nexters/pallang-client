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
  images: {
    // svg.d.ts의 SVGR 타입 선언과 충돌하는 기본 '*.svg' 타입(any) 주입을 막는다
    disableStaticImages: true,
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
              // SVGO가 viewBox를 제거하면 width/height 재정의 시 스케일이 안 되고 잘린다
              svgo: false,
            },
          },
        ],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
