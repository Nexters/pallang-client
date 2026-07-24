import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // svg.d.ts의 SVGR 타입 선언과 충돌하는 기본 '*.svg' 타입(any) 주입을 막는다
    disableStaticImages: true,
  },
  turbopack: {
    rules: {
      'app/**/*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
