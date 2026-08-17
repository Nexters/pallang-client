'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import {
  BookNewForm,
  type BookNewFormStatus,
} from '@/app/_shared/book/_components/BookNewForm/BookNewForm'

// 저장하기 버튼은 스크롤 영역 밖 고정 자리에 산다 — HTML의 form 속성으로 이 id의 <form>을
// 가리켜, 폼 밖에 있어도 제출은 그대로 이어진다(책 검색 시트의 footer도 같은 방식이다).
const BOOK_NEW_FORM_ID = 'book-new-form'

export function BookNewPageView() {
  const router = useRouter()
  const [status, setStatus] = useState<BookNewFormStatus>({ canSubmit: false, isPending: false })

  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <TopBar.Root>
        <TopBar.Title as="h1">책 추가하기</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action
          aria-label="닫기"
          onClick={() => {
            if (window.history.length <= 1) {
              router.replace('/book/list')
              return
            }
            router.back()
          }}
        >
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <BookNewForm
          formId={BOOK_NEW_FORM_ID}
          onCreated={() => {
            router.replace('/book/list')
          }}
          // setState는 렌더마다 같은 함수라 폼의 상태 보고 effect가 헛돌지 않는다
          onStatusChange={setStatus}
        />
      </div>

      <div className="mt-auto flex shrink-0 px-4 pt-4 pb-safe">
        <Button
          type="submit"
          form={BOOK_NEW_FORM_ID}
          className="h-[54px] flex-1"
          disabled={!status.canSubmit}
          loading={status.isPending}
        >
          저장하기
        </Button>
      </div>
    </main>
  )
}
