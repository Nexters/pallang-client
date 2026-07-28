import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SearchTextfield } from './SearchTextfield'

const meta = {
  title: 'Components/SearchTextfield',
  component: SearchTextfield,
  args: {
    placeholder: '검색어를 입력하세요',
  },
  decorators: [
    (Story) => (
      <div className="w-[375px] bg-bg-overlay p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchTextfield>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Focused: Story = {
  args: {
    autoFocus: true,
    placeholder: '',
  },
}

export const Typing: Story = {
  args: {
    autoFocus: true,
    defaultValue: '여',
    placeholder: '',
  },
}

export const Entered: Story = {
  args: {
    defaultValue: '여백이들과 교환독서',
  },
}
