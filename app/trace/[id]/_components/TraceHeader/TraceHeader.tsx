import Link from 'next/link'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'

export function TraceHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-2 px-4 py-2.5">
      <Link href="/" aria-label="뒤로 가기">
        <BackIcon />
      </Link>
      <h1 className="flex-1 text-title-18bd text-text-secondary">{title}</h1>
      <button type="button" aria-label="흔적 추가">
        <PlusIcon />
      </button>
    </header>
  )
}
