import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TraceNote } from './TraceNote'

const QUOTE =
  '지금도 초밥 집 주인장의 얼굴은 그릴 수 있을 만큼 정확히 떠오르는 걸 보면 그 때 초밥이 어지간히도 맛없어서 저에게 추위와 고통을 안겨줬던 모양입니다.'

const meta = {
  title: 'Trace/TraceNote',
  component: TraceNote,
  args: {
    quotedText: QUOTE,
    decorations: [],
  },
  decorators: [
    (Story) => (
      <div className="w-[311px] bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TraceNote>

export default meta

type Story = StoryObj<typeof meta>

export const NoEffect: Story = {}

export const Highlight: Story = {
  args: {
    decorations: [{ startOffset: 0, endOffset: 6, effectType: 'HIGHLIGHT', color: '#FFE08A' }],
  },
}

export const MixedEffects: Story = {
  args: {
    decorations: [
      { startOffset: 0, endOffset: 6, effectType: 'HIGHLIGHT', color: '#FFE08A' },
      { startOffset: 10, endOffset: 16, effectType: 'WAVY', color: '#EF5A06' },
      { startOffset: 20, endOffset: 26, effectType: 'UNDERLINE', color: '#EF5A06' },
    ],
  },
}
