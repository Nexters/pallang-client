import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { mockMyUser } from '../../_data/myUser.constant'
import { MyPageView } from './MyPageView'

const meta = {
  title: 'My/MyPageView',
  component: MyPageView,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile2' },
  },
  decorators: [
    (Story) => (
      <div className="flex h-dvh flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MyPageView>

export default meta

type Story = StoryObj<typeof meta>

export const LoggedIn: Story = {
  args: { user: mockMyUser, onLogout: () => undefined },
}

export const LoggedInWithoutOpinions: Story = {
  args: { user: { ...mockMyUser, opinionCount: 0 }, onLogout: () => undefined },
}

export const LoggedOut: Story = {
  args: { user: null },
}

export const LoggingOut: Story = {
  args: { user: mockMyUser, isLoggingOut: true, onLogout: () => undefined },
}

/** 로그인 상태에서 프로필 조회만 실패한 화면 — 메뉴와 로그아웃은 그대로 남는다 */
export const ProfileLoadFailed: Story = {
  args: {
    user: null,
    isProfileError: true,
    onRetryProfile: () => undefined,
    onLogout: () => undefined,
  },
}
