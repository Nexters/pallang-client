import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { EffectPicker } from './EffectPicker'

const meta = {
  title: 'Trace/EffectPicker',
  component: EffectPicker,
  args: {
    onPick: () => undefined,
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[343px] bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EffectPicker>

export default meta

type Story = StoryObj<typeof meta>

/** 형광펜·물결줄·색연필만 활성. 동그라미·점선·겹줄은 API enum에 대응 값이 없어 항상 비활성이다. */
export const Default: Story = {}

export const AllDisabled: Story = {
  args: { disabled: true },
}
