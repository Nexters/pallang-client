import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TabBar } from '@/app/_global/_components/TabBar/TabBar'

const meta = {
  title: 'Components/TabBar',
  component: TabBar,
  args: {
    activeTab: 'home',
  },
  argTypes: {
    activeTab: {
      control: 'inline-radio',
      options: ['home', 'book', 'meeting', 'my'],
    },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[375px] overflow-hidden bg-bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabBar>

export default meta

type Story = StoryObj<typeof meta>

export const HomeActive: Story = {}

export const BookActive: Story = {
  args: {
    activeTab: 'book',
  },
}

export const MeetingActive: Story = {
  args: {
    activeTab: 'meeting',
  },
}

export const MyActive: Story = {
  args: {
    activeTab: 'my',
  },
}
