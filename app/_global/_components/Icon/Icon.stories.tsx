import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { FC, SVGProps } from 'react'
import { useState } from 'react'

import BackIcon from './assets/back.svg'
import BookAddIcon from './assets/book-add.svg'
import CameraIcon from './assets/camera.svg'
import CautionIcon from './assets/caution.svg'
import ChevronDownIcon from './assets/chevron-down.svg'
import CloseIcon from './assets/close.svg'
import CommentIcon from './assets/comment.svg'
import ContentIcon from './assets/content.svg'
import HomeIcon from './assets/home.svg'
import KakaoIcon from './assets/kakao.svg'
import LikeIcon from './assets/like.svg'
import MyIcon from './assets/my.svg'
import NextIcon from './assets/next.svg'
import PencilIcon from './assets/pencil.svg'
import PlusIcon from './assets/plus.svg'
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
  { name: 'HomeIcon', Component: HomeIcon },
  { name: 'MyIcon', Component: MyIcon },
  { name: 'SearchIcon', Component: SearchIcon },
  { name: 'BookAddIcon', Component: BookAddIcon },
  { name: 'SettingIcon', Component: SettingIcon },
  { name: 'KakaoIcon', Component: KakaoIcon },
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
