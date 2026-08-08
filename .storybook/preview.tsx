import '../app/globals.css'

import type { Preview } from '@storybook/nextjs-vite'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  PathnameContext,
  PathParamsContext,
  SearchParamsContext,
} from 'next/dist/shared/lib/hooks-client-context.shared-runtime'

import { AuthProvider } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

const storybookRouter: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  refresh: () => undefined,
  push: () => undefined,
  replace: () => undefined,
  prefetch: () => undefined,
}

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
  decorators: [
    (Story) => (
      <AppRouterContext.Provider value={storybookRouter}>
        <PathnameContext.Provider value="/">
          <SearchParamsContext.Provider value={new URLSearchParams()}>
            <PathParamsContext.Provider value={{}}>
              <AuthProvider>
                <LoginGateProvider>
                  <Story />
                </LoginGateProvider>
              </AuthProvider>
            </PathParamsContext.Provider>
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    ),
  ],
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
