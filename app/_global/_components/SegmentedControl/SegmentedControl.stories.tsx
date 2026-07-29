import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    label: '스포일러',
    options: [
      { value: 'no', label: '없어요' },
      { value: 'yes', label: '있어요' },
    ],
    value: 'no',
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-[343px] bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SegmentedControl>

export default meta

type Story = StoryObj<typeof meta>

export const NoSpoiler: Story = {}

export const HasSpoiler: Story = {
  args: { value: 'yes' },
}
