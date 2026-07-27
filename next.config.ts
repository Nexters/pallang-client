import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
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
