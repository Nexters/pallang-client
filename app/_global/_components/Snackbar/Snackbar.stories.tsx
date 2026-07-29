import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

const meta = {
  title: 'Components/Snackbar',
  component: Snackbar,
  args: {
    message: '영역 선택 후 효과를 입력해주세요!',
    onClose: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="relative h-[240px] w-[375px] overflow-hidden bg-bg-dark">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Snackbar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SaveFailed: Story = {
  args: { message: '흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.' },
}
