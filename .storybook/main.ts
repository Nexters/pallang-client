import type { StorybookConfig } from '@storybook/nextjs-vite'
import svgr from 'vite-plugin-svgr'

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  viteFinal: (viteConfig) => {
    // Next(turbopack)의 @svgr/webpack 룰과 동일하게 svg import를 컴포넌트로 변환
    viteConfig.plugins ??= []
    // nextjs-vite가 svg import에 ?ignore 쿼리를 붙이므로 쿼리까지 포함해 매칭한다
    viteConfig.plugins.push(
      svgr({
        include: /\/app\/.+\.svg(\?.*)?$/,
        // next.config.ts의 @svgr/webpack 옵션과 동일하게 기본 색 지정, viewBox 보존 위해 svgo 비활성
        svgrOptions: { svgProps: { className: 'text-icon-primary' }, svgo: false },
      }),
    )
    return viteConfig
  },
}

export default config
