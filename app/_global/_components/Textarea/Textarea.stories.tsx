import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Textarea } from './Textarea'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['light', 'dark'],
    },
  },
  args: {
    placeholder: '의견을 작성해주세요.',
    variant: 'light',
    maxLength: 150,
    disabled: false,
  },
  decorators: [
    (Story, { args }) => (
      <div
        style={{
          width: 375,
          padding: 16,
          background: args.variant === 'dark' ? '#111' : '#fff',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OnDark: Story = {
  args: {
    variant: 'dark',
  },
}
