import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ComponentProps } from 'react'
import { useState } from 'react'

import { Select } from './Select'

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
]

const meta = {
  title: 'Components/Select',
  component: Select,
  args: {
    label: '정렬 기준',
    options: SORT_OPTIONS,
    defaultValue: 'latest',
  },
  // 트리거·옵션이 모두 흰 텍스트라 밝은 배경에서는 보이지 않는다 — 어두운 배경 위에 올려 확인한다.
  // 열리면 트리거 아래로 목록이 이어 붙어 한 덩어리가 되므로 세로 여유도 함께 준다.
  decorators: [
    (Story) => (
      <div className="flex min-h-[220px] w-[343px] items-start bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** 밝은 면 위에 얹는 톤(시안 Variant3/4) — 채운 회색 대신 유리 질감으로 깔린다 */
export const Light: Story = {
  args: { tone: 'light' },
  decorators: [
    (Story) => (
      <div className="flex min-h-[220px] w-[343px] items-start bg-bg-surface p-4">
        <Story />
      </div>
    ),
  ],
}

function ControlledSelect({
  label,
  options,
}: Pick<ComponentProps<typeof Select>, 'label' | 'options'>) {
  const [value, setValue] = useState('popular')

  return (
    <div className="flex flex-col gap-2">
      <Select label={label} options={options} value={value} onValueChange={setValue} />
      <p className="px-2 font-pretendard text-caption-12rg text-text-inverse">선택값: {value}</p>
    </div>
  )
}

export const Controlled: Story = {
  render: ({ label, options }) => <ControlledSelect label={label} options={options} />,
}
