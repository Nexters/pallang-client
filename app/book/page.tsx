import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import { BookItemList } from './_components/BookItemList/BookItemList'
import { BookSearchBar } from './_components/BookSearchBar/BookSearchBar'

export default function BookPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-bg-default">
      <TopBar.Root>
        <TopBar.Title>
          도서 목록
          <span className="text-text-placeholder-a50">12</span>
        </TopBar.Title>
        <TopBar.Spacer />
        <TopBar.LinkAction href="/" aria-label="닫기">
          <CloseIcon />
        </TopBar.LinkAction>
      </TopBar.Root>
      <BookSearchBar />
      <BookItemList />
    </main>
  )
}
