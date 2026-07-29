import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'

import { TopBar } from './TopBar'

const meta = {
  title: 'Components/TopBar',
  component: TopBar.Root,
  decorators: [
    (Story) => (
      <div className="w-[375px] bg-bg-default">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TopBar.Root>

export default meta

type Story = StoryObj<typeof meta>

export const BookList: Story = {
  render: () => (
    <TopBar.Root>
      <TopBar.Title>
        도서 목록
        <span className="text-text-placeholder-a50">12</span>
      </TopBar.Title>
      <TopBar.Spacer />
      <TopBar.Action aria-label="닫기">
        <CloseIcon />
      </TopBar.Action>
    </TopBar.Root>
  ),
}

export const TraceBookTitle: Story = {
  render: () => (
    <TopBar.Root>
      <TopBar.LinkAction href="/" aria-label="뒤로 가기">
        <BackIcon />
      </TopBar.LinkAction>
      <TopBar.Title className="flex-1">모순</TopBar.Title>
      <TopBar.Action aria-label="흔적 추가">
        <PlusIcon />
      </TopBar.Action>
    </TopBar.Root>
  ),
}

export const TraceDetail: Story = {
  render: () => (
    <TopBar.Root className="bg-bg-book-card">
      <TopBar.Action aria-label="이전 의견">
        <BackIcon />
      </TopBar.Action>
      <TopBar.Title>초코우유</TopBar.Title>
      <TopBar.Action aria-label="다음 의견">
        <NextIcon />
      </TopBar.Action>
      <TopBar.Spacer />
      <TopBar.Action aria-label="닫기">
        <CloseIcon />
      </TopBar.Action>
    </TopBar.Root>
  ),
}
