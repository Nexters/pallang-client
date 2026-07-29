import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  args: {
    open: true,
    title: '새로운 흔적을 어떻게 남길까요?',
    onClose: () => undefined,
    children: <p className="text-body-16rg text-text-secondary">본문이 들어갑니다.</p>,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="relative h-[600px] w-[375px] overflow-hidden bg-bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Closed: Story = {
  args: { open: false },
}
