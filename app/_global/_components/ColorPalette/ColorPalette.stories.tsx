import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ColorPalette } from './ColorPalette'

const meta = {
  title: 'Foundation/Colors',
  component: ColorPalette,
} satisfies Meta<typeof ColorPalette>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
