import Link from 'next/link'

import HomeIcon from '@/app/_global/_components/Icon/assets/home.svg'
import MyIcon from '@/app/_global/_components/Icon/assets/my.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'

// ponytail: 마이페이지 전용 배치 — 다른 route에서 쓰게 되면 _shared로 이동
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 bg-nav-bg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-8 py-2">
        <Link href="/" className="flex w-12 flex-col items-center gap-1 text-icon-muted">
          <HomeIcon className="text-icon-muted" />
          <span className="text-caption-12rg">home</span>
        </Link>
        <button
          type="button"
          className="flex h-12 items-center gap-1 rounded-full bg-interactive-accent px-5 text-body-16bd text-text-inverse"
        >
          <PlusIcon className="text-icon-active" />
          흔적 남기기
        </button>
        <Link href="/my" className="flex w-12 flex-col items-center gap-1 text-icon-active">
          <MyIcon className="text-icon-active" />
          <span className="text-caption-12rg">MY</span>
        </Link>
      </div>
    </nav>
  )
}
