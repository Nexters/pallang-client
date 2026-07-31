import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

const meta = {
  title: 'Components/Snackbar',
  component: Snackbar,
  args: {
    message: '영역 선택 후 효과를 입력해주세요!',
    onClose: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="relative h-[240px] w-[375px] overflow-hidden bg-bg-dark">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Snackbar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SaveFailed: Story = {
  args: { message: '흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.' },
}

// 등장·퇴장 전환은 정지 화면으로는 볼 수 없다
export const Toggle: Story = {
  render: (args) => {
    const [message, setMessage] = useState('')
    return (
      <>
        <button
          type="button"
          className="m-4 rounded-2xl bg-interactive-btn-primary px-4 py-3 text-text-inverse"
          onClick={() => {
            setMessage(message ? '' : args.message)
          }}
        >
          토스트 토글
        </button>
        <Snackbar
          message={message}
          onClose={() => {
            setMessage('')
          }}
        />
      </>
    )
  },
}
