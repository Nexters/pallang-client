import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/app/_global/_components/Button/Button'

import { Dialog } from './Dialog'

const meta = {
  title: 'Components/Dialog',
  component: Dialog.Root,
  parameters: {
    layout: 'centered',
  },
  // autodocs에 열린 상태로 박제되지 않도록 닫은 채로 둔다. 트리거를 눌러 확인한다.
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof Dialog.Root>

export default meta

type Story = StoryObj<typeof meta>

// Figma 2260:6966 / 2224:19102 — 버튼 1개(풀폭)
export const SingleAction: Story = {
  render: (args) => (
    <Dialog.Root {...args}>
      <Dialog.Trigger render={<Button variant="activated">다이얼로그 열기</Button>} />
      <Dialog.Content>
        <Dialog.Illustration />
        <Dialog.Header>
          <Dialog.Title>로그인하면 확인 할 수 있어요!</Dialog.Title>
          <Dialog.Description>팔랑과 함께하고 더 많은 흔적을 확인해보세요.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close render={<Button variant="activated">로그인 하러가기</Button>} />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  ),
}

// Figma 2545:7228 — 버튼 2개(151.5px씩 + gap 8)
export const TwoActions: Story = {
  render: (args) => (
    <Dialog.Root {...args}>
      <Dialog.Trigger render={<Button variant="activated">다이얼로그 열기</Button>} />
      <Dialog.Content>
        <Dialog.Illustration />
        <Dialog.Header>
          <Dialog.Title>이미지를 불러오지 못했어요</Dialog.Title>
          <Dialog.Description>일시적인 오류일 수 있어요. 다시 시도해 주세요.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close render={<Button variant="back">닫기</Button>} />
          <Button variant="activated">다시 시도하기</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  ),
}
