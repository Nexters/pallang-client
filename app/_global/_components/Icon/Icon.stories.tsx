import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { FC, SVGProps } from 'react'
import { useState } from 'react'

import AppleIcon from './assets/apple.svg'
import BackIcon from './assets/back.svg'
import BookAddIcon from './assets/book-add.svg'
import CameraIcon from './assets/camera.svg'
import CautionIcon from './assets/caution.svg'
import ChevronDownIcon from './assets/chevron-down.svg'
import CloseIcon from './assets/close.svg'
import CommentIcon from './assets/comment.svg'
import ContentIcon from './assets/content.svg'
import EffectCircleIcon from './assets/effect-circle.svg'
import EffectDotsIcon from './assets/effect-dots.svg'
import EffectHighlightIcon from './assets/effect-highlight.svg'
import EffectPencilIcon from './assets/effect-pencil.svg'
import EffectUnderlineIcon from './assets/effect-underline.svg'
import EffectWaveIcon from './assets/effect-wave.svg'
import HomeIcon from './assets/home.svg'
import KakaoIcon from './assets/kakao.svg'
import LikeIcon from './assets/like.svg'
import MeatballsMenuIcon from './assets/meatballs-menu.svg'
import MyIcon from './assets/my.svg'
import NextIcon from './assets/next.svg'
import PencilIcon from './assets/pencil.svg'
import PlusIcon from './assets/plus.svg'
import ReplyIcon from './assets/reply.svg'
import ResetIcon from './assets/reset.svg'
import SearchIcon from './assets/search.svg'
import SettingIcon from './assets/setting.svg'
import TrashIcon from './assets/trash.svg'

const ICONS: { name: string; Component: FC<SVGProps<SVGSVGElement>> }[] = [
  { name: 'CameraIcon', Component: CameraIcon },
  { name: 'PencilIcon', Component: PencilIcon },
  { name: 'CloseIcon', Component: CloseIcon },
  { name: 'PlusIcon', Component: PlusIcon },
  { name: 'ContentIcon', Component: ContentIcon },
  { name: 'ResetIcon', Component: ResetIcon },
  { name: 'TrashIcon', Component: TrashIcon },
  { name: 'BackIcon', Component: BackIcon },
  { name: 'NextIcon', Component: NextIcon },
  { name: 'ChevronDownIcon', Component: ChevronDownIcon },
  { name: 'CautionIcon', Component: CautionIcon },
  { name: 'LikeIcon', Component: LikeIcon },
  { name: 'CommentIcon', Component: CommentIcon },
  // 댓글 카드 앞의 답글 표시(16x16 원본) — 흔적에 달린 댓글임을 나타낸다
  { name: 'ReplyIcon', Component: ReplyIcon },
  // 흔적·댓글의 ⋯ 메뉴(신고·차단) 트리거
  { name: 'MeatballsMenuIcon', Component: MeatballsMenuIcon },
  { name: 'HomeIcon', Component: HomeIcon },
  { name: 'MyIcon', Component: MyIcon },
  { name: 'SearchIcon', Component: SearchIcon },
  { name: 'BookAddIcon', Component: BookAddIcon },
  { name: 'SettingIcon', Component: SettingIcon },
  { name: 'KakaoIcon', Component: KakaoIcon },
  { name: 'AppleIcon', Component: AppleIcon },
  // 흔적 꾸미기 효과 썸네일. 글자(#717171)와 효과 자국(브랜드 오렌지)이 고정된 2색 아이콘이라
  // currentColor로 치환하지 않는다 — 색을 바꿀 수 있게 만들면 두 색 중 하나만 따라간다.
  { name: 'EffectHighlightIcon', Component: EffectHighlightIcon },
  { name: 'EffectWaveIcon', Component: EffectWaveIcon },
  { name: 'EffectCircleIcon', Component: EffectCircleIcon },
  { name: 'EffectPencilIcon', Component: EffectPencilIcon },
  { name: 'EffectDotsIcon', Component: EffectDotsIcon },
  { name: 'EffectUnderlineIcon', Component: EffectUnderlineIcon },
]

const meta = {
  title: 'Foundation/Icons',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function IconTile({ name, Component }: { name: string; Component: FC<SVGProps<SVGSVGElement>> }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`<${name} />`).catch(console.error)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1200)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`<${name} /> 복사`}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-neutral-200 px-2 py-4 hover:bg-neutral-50"
    >
      <Component />
      <span className={`text-xs ${copied ? 'text-green-600' : 'text-neutral-500'}`}>
        {copied ? 'Copied!' : name}
      </span>
    </button>
  )
}

export const AllIcons: Story = {
  parameters: {
    docs: {
      description: { story: '아이콘을 클릭하면 `<CameraIcon />` 형태의 코드가 복사됩니다.' },
    },
  },
  render: () => (
    <div className="grid grid-cols-[repeat(4,minmax(120px,1fr))] gap-3">
      {ICONS.map(({ name, Component }) => (
        <IconTile key={name} name={name} Component={Component} />
      ))}
    </div>
  ),
}
