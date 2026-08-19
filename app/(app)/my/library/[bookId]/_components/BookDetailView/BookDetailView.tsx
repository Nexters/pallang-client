'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import type { MyPassage } from '@/app/_global/_queries/user.queries'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import { SpoilerReleaseDialog } from '@/app/_shared/user/_components/SpoilerReleaseDialog/SpoilerReleaseDialog'

import { type BookRecordTab, bookRecordTabIds } from '../../_data/bookRecordTab.constant'
import { BookHeaderSkeleton } from '../BookHeaderSkeleton/BookHeaderSkeleton'
import { BookRecordTabs } from '../BookRecordTabs/BookRecordTabs'
import { LikedPanel } from '../LikedPanel/LikedPanel'
import { OpinionPanel } from '../OpinionPanel/OpinionPanel'
import { SpoilerPanel } from '../SpoilerPanel/SpoilerPanel'

/** 좋아요를 되돌릴 대상 — 스낵바가 닫히거나 탭이 바뀌면 비운다 */
type UnlikedTarget = { nickname: string; undo: () => void }

/**
 * 내 서재 > 책 상세(Figma 225:12569).
 * 책 머리는 스크롤에 걷히고 탭만 상단에 붙는다 — `position: sticky` 하나로 끝나 JS로 재지 않는다.
 */
export function BookDetailView({ bookId }: { bookId: number }) {
  const [tab, setTab] = useState<BookRecordTab>('opinion')
  const [unliked, setUnliked] = useState<UnlikedTarget | null>(null)
  const [releasing, setReleasing] = useState<MyPassage | null>(null)

  const bookQuery = useQuery(bookQueries.detail(bookId))
  const book = bookQuery.data?.data

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
        {/* 셸(TopBar·탭)은 데이터를 기다리지 않는다 — 책 머리 자리만 골격으로 채운다 */}
        <div className="shrink-0 px-4 pt-2">
          {book ? (
            <BookItem
              author={book.author}
              coverImageUrl={book.coverImageUrl}
              opinionCount={book.opinionCount}
              passageCount={book.passageCount}
              publisher={book.publisher}
              title={book.title}
            />
          ) : (
            <BookHeaderSkeleton />
          )}
        </div>

        {/* 스크롤하면 위 책 머리가 걷히고 이 줄만 상단에 남는다(Figma 225:12619) */}
        <div className="sticky top-0 z-10 flex shrink-0 justify-center bg-bg-default p-2">
          <BookRecordTabs
            value={tab}
            onChange={(next) => {
              setTab(next)
              // 탭을 바꾸면 되돌릴 카드도 열어 둔 대상도 화면에서 사라진다 — 안내를 함께 접는다
              setUnliked(null)
              setReleasing(null)
            }}
          />
        </div>

        {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다(Figma 225:12580) */}
        <div
          role="tabpanel"
          id={bookRecordTabIds(tab).panelId}
          aria-labelledby={bookRecordTabIds(tab).tabId}
          className="flex flex-1 flex-col gap-2 bg-bg-surface p-4"
        >
          {tab === 'opinion' && <OpinionPanel bookId={bookId} />}
          {tab === 'like' && <LikedPanel bookId={bookId} onUnlike={setUnliked} />}
          {tab === 'spoiler' && <SpoilerPanel bookId={bookId} onRelease={setReleasing} />}
        </div>
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

      <SpoilerReleaseDialog
        open={releasing !== null}
        onCancel={() => {
          setReleasing(null)
        }}
      />
    </>
  )
}
