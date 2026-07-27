import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/app/_global/_components/Button/Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: '다음',
    className: 'w-[167px]',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'back', 'activated'],
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Back: Story = {
  args: { variant: 'back' },
}

export const Activated: Story = {
  args: { variant: 'activated' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
