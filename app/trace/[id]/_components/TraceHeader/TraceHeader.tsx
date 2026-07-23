import Link from 'next/link'

import { Icon } from '../Icon/Icon'

export function TraceHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-2 px-4 py-2.5">
      <Link href="/" aria-label="뒤로 가기">
        <Icon name="back" color="#222" />
      </Link>
      <h1 className="flex-1 text-[18px] leading-[1.2] font-bold tracking-[-0.36px] text-[#222]">
        {title}
      </h1>
      <button type="button" aria-label="흔적 추가">
        <Icon name="plus" color="#222" />
      </button>
    </header>
  )
}
