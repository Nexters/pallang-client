import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ExampleCard } from './ExampleCard'

const meta = {
  title: 'Example/ExampleCard',
  component: ExampleCard,
} satisfies Meta<typeof ExampleCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    item: { id: '1', label: '스토리북 연결 확인' },
  },
}
