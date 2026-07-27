import '../app/globals.css'

import type { Preview } from '@storybook/nextjs-vite'

const appViewports = {
  mobile375: {
    name: 'Mobile 375 x 812',
    styles: {
      width: '375px',
      height: '812px',
    },
    type: 'mobile',
  },
  mobileMax530: {
    name: 'Mobile Max 530 x 900',
    styles: {
      width: '530px',
      height: '900px',
    },
    type: 'mobile',
  },
} as const

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    viewport: {
      options: appViewports,
    },
  },
}

export default preview
