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

export const LoggedOut: Story = {
  args: { user: null },
}
