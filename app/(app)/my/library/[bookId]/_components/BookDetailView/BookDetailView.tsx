'use client'

import { Tabs } from '@base-ui/react/tabs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { bookMutations, bookQueries, type BookStatus } from '@/app/_global/_queries/book.queries'
import type { MyPassage } from '@/app/_global/_queries/user.queries'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import { SpoilerReleaseDialog } from '@/app/_shared/user/_components/SpoilerReleaseDialog/SpoilerReleaseDialog'

import type { BookRecordTab } from '../../_data/bookRecordTab.constant'
import { BookHeaderSkeleton } from '../BookHeaderSkeleton/BookHeaderSkeleton'
import { BookRecordTabs } from '../BookRecordTabs/BookRecordTabs'
import { BookStatusChip } from '../BookStatusChip/BookStatusChip'
import { BookStatusSheet } from '../BookStatusSheet/BookStatusSheet'
import { LikedPanel } from '../LikedPanel/LikedPanel'
import { OpinionPanel } from '../OpinionPanel/OpinionPanel'
import { SpoilerPanel } from '../SpoilerPanel/SpoilerPanel'

/** 좋아요를 되돌릴 대상 — 스낵바가 닫히거나 탭이 바뀌면 비운다 */
type UnlikedTarget = { nickname: string; undo: () => void }

/**
 * 내 서재 > 책 상세(Figma 225:12569).
 * 책 머리는 스크롤에 걷히고 탭만 상단에 붙는다 — `position: sticky` 하나로 끝나 JS로 재지 않는다.
 */
/** 패널 세 장이 같은 회색 면을 쓴다 — 한곳에 두어 서로 어긋나지 않게 한다 */
const PANEL_CLASS = 'flex flex-1 flex-col gap-2 bg-bg-surface p-4'

export function BookDetailView({ bookId }: { bookId: number }) {
  const [tab, setTab] = useState<BookRecordTab>('opinion')
  const [unliked, setUnliked] = useState<UnlikedTarget | null>(null)
  const [releasing, setReleasing] = useState<MyPassage | null>(null)
  // 시트가 들고 있는 선택값. 열 때 서버 상태로 채우고, 닫으면 다음에 열 때 다시 채운다
  const [statusDraft, setStatusDraft] = useState<BookStatus>(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)

  const queryClient = useQueryClient()
  const bookQuery = useQuery(bookQueries.detail(bookId))
  const book = bookQuery.data?.data
  const updateStatus = useMutation({
    ...bookMutations.updateStatus(),
    onSuccess: async () => {
      setIsStatusOpen(false)
      // 뱃지가 읽는 myStatus는 책 상세 응답에만 실린다 — 되살릴 캐시도 그 하나뿐이다
      await queryClient.invalidateQueries({ queryKey: bookQueries.detail(bookId).queryKey })
    },
  })

  const handleSaveStatus = () => {
    if (!statusDraft) return
    // PUT은 상태와 현재 페이지를 함께 덮어쓴다 — 읽던 쪽을 지우지 않게 지금 값을 그대로 실어 보낸다
    updateStatus.mutate({
      bookId,
      status: statusDraft,
      currentPage: book?.myCurrentPage ?? undefined,
    })
  }

  return (
    <>
      <ScreenLayout
        title="내 서재"
        action={
          <button
            type="button"
            disabled
            // ponytail: 누른 뒤 화면이 시안 어디에도 없다. 자리만 시안(225:12579)대로 잡고 죽여 둔다.
            // 편집 화면이 정해지면 disabled만 걷어내고 onClick을 달면 된다.
            className="flex shrink-0 items-center justify-center rounded-full bg-black/10 px-2.5 py-2 text-body-14sb text-text-primary"
          >
            편집
          </button>
        }
      >
        <Tabs.Root
          value={tab}
          onValueChange={(next) => {
            setTab(next as BookRecordTab)
            // 탭을 바꾸면 되돌릴 카드도 열어 둔 대상도 화면에서 사라진다 — 안내를 함께 접는다
            setUnliked(null)
            setReleasing(null)
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* 셸(TopBar·탭)은 데이터를 기다리지 않는다 — 책 머리 자리만 골격으로 채운다 */}
          <div className="shrink-0 px-4 pt-2">
            {book ? (
              <BookItem
                author={book.author}
                coverImageUrl={book.coverImageUrl}
                opinionCount={book.opinionCount}
                passageCount={book.passageCount}
                publisher={book.publisher}
                statusBadge={
                  <BookStatusChip
                    status={book.myStatus ?? null}
                    onClick={() => {
                      setStatusDraft(book.myStatus ?? null)
                      setIsStatusOpen(true)
                    }}
                  />
                }
                title={book.title}
              />
            ) : (
              <BookHeaderSkeleton />
            )}
          </div>

          {/* 스크롤하면 위 책 머리가 걷히고 이 줄만 상단에 남는다(Figma 225:12619) */}
          <div className="sticky top-0 z-10 flex shrink-0 justify-center bg-bg-default p-2">
            <BookRecordTabs />
          </div>

          {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다(Figma 225:12580).
            Tabs.Panel은 고르지 않은 쪽을 떼어 두므로(keepMounted 기본값) 활성 탭의 쿼리만 나간다. */}
          <Tabs.Panel value="opinion" className={PANEL_CLASS}>
            <OpinionPanel bookId={bookId} />
          </Tabs.Panel>
          <Tabs.Panel value="like" className={PANEL_CLASS}>
            <LikedPanel bookId={bookId} onUnlike={setUnliked} />
          </Tabs.Panel>
          <Tabs.Panel value="spoiler" className={PANEL_CLASS}>
            <SpoilerPanel bookId={bookId} onRelease={setReleasing} />
          </Tabs.Panel>
        </Tabs.Root>
      </ScreenLayout>

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다(Figma 225:13419) */}
      <Snackbar
        tone="light"
        message={unliked ? `${unliked.nickname}님의 좋아요를 해제했어요` : ''}
        actionLabel="취소"
        onAction={() => {
          unliked?.undo()
          setUnliked(null)
        }}
        onClose={() => {
          setUnliked(null)
        }}
      />

      <BookStatusSheet
        open={isStatusOpen}
        value={statusDraft}
        saving={updateStatus.isPending}
        onChange={setStatusDraft}
        onClose={() => {
          setIsStatusOpen(false)
        }}
        onSave={handleSaveStatus}
      />

      <SpoilerReleaseDialog
        open={releasing !== null}
        onCancel={() => {
          setReleasing(null)
        }}
      />
    </>
  )
}
