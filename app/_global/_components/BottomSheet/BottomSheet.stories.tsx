import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

// base-ui 포털로 body 끝에 렌더되므로 프레임 데코레이터로 가둘 수 없다 — 캔버스 전체를 쓴다
const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  args: {
    open: true,
    title: '새로운 흔적을 어떻게 남길까요?',
    onClose: () => undefined,
    children: <p className="text-body-16rg text-text-secondary">본문이 들어갑니다.</p>,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BottomSheet>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Closed: Story = {
  args: { open: false },
}

// 등장·퇴장 전환은 정지 화면으로는 볼 수 없다
export const Toggle: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="p-4">
        <button
          type="button"
          className="rounded-2xl bg-interactive-btn-primary px-4 py-3 text-text-inverse"
          onClick={() => {
            setOpen(true)
          }}
        >
          시트 열기
        </button>
        <BottomSheet
          {...args}
          open={open}
          onClose={() => {
            setOpen(false)
          }}
        />
      </div>
    )
  },
}
