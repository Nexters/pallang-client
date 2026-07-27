import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { TabBar } from '@/app/_global/_components/TabBar/TabBar'
import Logo from '@/public/images/logo.svg'

export default function Home() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-black">
      <section
        aria-label="홈"
        className="relative z-10 min-h-0 flex-1 rounded-b-[28px] bg-bg-alternative bg-[linear-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px)] bg-size-[24px_24px]"
      >
        <header className="flex items-center justify-between px-4 pt-4">
          <Logo aria-label="Pallang" className="h-7 w-18.75" />
          <button
            type="button"
            aria-label="검색"
            className="flex size-8 items-center justify-center text-icon-primary"
          >
            <SearchIcon aria-hidden="true" className="size-8" />
          </button>
        </header>
      </section>
      <TabBar activeTab="home" className="-mt-7 shrink-0" />
    </div>
  )
}
