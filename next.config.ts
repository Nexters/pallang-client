import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  // 로컬 개발 전용 프록시. 개발 API 서버가 CORS 헤더를 내려주지 않아
  // 브라우저 요청이 차단되므로, dev에서는 /api/*를 같은 origin으로 받아 서버가 대신 호출한다.
  // (백엔드 API 경로는 모두 /api/*이고, 이 앱에는 로컬 /api route handler가 없다.)
  // 프로덕션은 NEXT_PUBLIC_API_URL로 직접 호출하며 백엔드 CORS 설정이 필요하다.
  rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    if (process.env.NODE_ENV !== 'development' || !apiOrigin) return Promise.resolve([])
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
