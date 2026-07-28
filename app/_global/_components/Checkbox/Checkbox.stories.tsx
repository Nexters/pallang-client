import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from '@/app/_global/_components/Checkbox/Checkbox'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: {
    'aria-label': '약관 동의 선택',
  },
  argTypes: {
    checked: {
      control: 'boolean',
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}

export const Checked: Story = {
  args: {
    checked: true,
  },
}
