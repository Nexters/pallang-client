'use client'

import { Tabs } from '@base-ui/react/tabs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { useState } from 'react'

import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { bookMutations, bookQueries, type BookStatus } from '@/app/_global/_queries/book.queries'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'
import { SpoilerReleaseDialog } from '@/app/_shared/user/_components/SpoilerReleaseDialog/SpoilerReleaseDialog'
import { useSpoilerRelease } from '@/app/_shared/user/_hooks/useSpoilerRelease'

import type { BookRecordTab } from '../../_data/bookRecordTab.constant'
import { BookEditAction } from '../BookEditAction/BookEditAction'
import { BookHeaderSkeleton } from '../BookHeaderSkeleton/BookHeaderSkeleton'
import { BookRecordTabs } from '../BookRecordTabs/BookRecordTabs'
import { BookStatusChip } from '../BookStatusChip/BookStatusChip'
import { BookStatusSheet } from '../BookStatusSheet/BookStatusSheet'
import { LikedPanel } from '../LikedPanel/LikedPanel'
import { OpinionPanel } from '../OpinionPanel/OpinionPanel'
import { SpoilerPanel } from '../SpoilerPanel/SpoilerPanel'

/** 좋아요를 되돌릴 대상 — 스낵바가 닫히거나 탭이 바뀌면 비운다 */
type UnlikedTarget = { nickname: string; undo: () => void }

/** 화면 아래 같은 자리를 쓰는 안내의 종류 — 한 번에 하나만 선다 */
type NoticeKind = 'unliked' | 'release' | 'status'

/** Snackbar에 그대로 펴는 안내 한 벌 */
type Notice = {
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
}

/**
 * 내 서재 > 책 상세.
 * 책 머리는 스크롤에 걷히고 탭만 상단에 붙는다 — `position: sticky` 하나로 끝나 JS로 재지 않는다.
 */
/** 패널 세 장이 같은 회색 면을 쓴다 — 한곳에 두어 서로 어긋나지 않게 한다 */
const PANEL_CLASS = 'flex flex-1 flex-col gap-2 bg-bg-surface p-4'

export function BookDetailView({ bookId }: { bookId: number }) {
  const [tab, setTab] = useState<BookRecordTab>('opinion')
  const [unliked, setUnliked] = useState<UnlikedTarget | null>(null)
  const release = useSpoilerRelease()
  // 시트가 들고 있는 선택값. 열 때 서버 상태로 채우고, 닫으면 다음에 열 때 다시 채운다
  const [statusDraft, setStatusDraft] = useState<BookStatus>(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)

  const queryClient = useQueryClient()
  const bookQuery = useQuery(bookQueries.detail(bookId))
  const book = bookQuery.data?.data
  const savedStatus = book?.myStatus ?? null
  const [statusError, setStatusError] = useState('')

  /**
   * 세 안내가 화면 아래 같은 자리(`absolute inset-x-4 bottom-24`)에 선다.
   * 겹치면 아래에 깔린 쪽은 남은 수명 동안 누를 수 없다 — 새 안내를 띄우기 전에 이전 것을 걷는다.
   */
  const clearNotices = () => {
    setUnliked(null)
    release.clearError()
    setStatusError('')
  }

  const saveStatus = useMutation({
    ...bookMutations.saveStatus(),
    onSuccess: async (_data, { status }) => {
      setIsStatusOpen(false)
      setStatusError('')
      // 무효화는 캐시를 지우지 않아 다시 물어본 응답이 올 때까지 뱃지가 옛 값을 보여준다.
      // 해제(DELETE)는 응답 본문이 비어 있어 보낸 값을 그대로 먹인다 — 두 갈래가 같은 자리를 쓴다.
      queryClient.setQueryData(bookQueries.detail(bookId).queryKey, (previous) =>
        previous?.data ? { ...previous, data: { ...previous.data, myStatus: status } } : previous,
      )
      // 뱃지가 읽는 myStatus는 책 상세 응답에만 실린다 — 되살릴 캐시도 그 하나뿐이다
      await queryClient.invalidateQueries({ queryKey: bookQueries.detail(bookId).queryKey })
    },
    // 실패하면 뱃지도 시트도 그대로라 아무 일도 없던 것처럼 보인다 — 해제는 특히 되돌아온 줄 모른다
    onError: () => {
      setIsStatusOpen(false)
      clearNotices()
      setStatusError('독서 상태를 저장하지 못했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  /** 지금 서 있어야 할 안내. 셋이 동시에 차지 않도록 걷어 두지만, 순서는 여기서 한 번 더 못 박는다 */
  const currentNoticeKind = (): NoticeKind | null => {
    if (unliked) return 'unliked'
    if (release.errorMessage) return 'release'
    if (statusError) return 'status'
    return null
  }

  // 퇴장하는 동안 종류까지 비면 되돌리기 버튼이 닫기(X)로 바뀐 채 사라진다 —
  // Snackbar가 문구를 붙잡는 것과 같은 이유로 종류도 붙잡는다
  const noticeKind = useLastPresent(currentNoticeKind())

  const handleSaveStatus = () => {
    // PUT은 상태와 현재 페이지를 함께 덮어쓴다 — 읽던 쪽을 지우지 않게 지금 값을 그대로 실어 보낸다.
    // 고른 것을 모두 푼 채로 왔으면 status가 null이라 해제(DELETE)로 나간다.
    saveStatus.mutate({
      bookId,
      status: statusDraft,
      currentPage: book?.myCurrentPage ?? undefined,
    })
  }

  // 지워졌거나 볼 수 없는 책이면 화면을 세울 근거가 없다 — 셸째로 not-found로 보낸다.
  // 훅을 모두 부른 뒤라야 한다(notFound는 렌더를 끊는다).
  if (!book && bookQuery.error instanceof ApiError && bookQuery.error.status === 404) notFound()

  /**
   * 책 머리 자리. 셸(TopBar·탭)은 이 분기 바깥이라 실패해도 세 패널과 뒤로 가기는 그대로 남는다.
   * 들고 있는 값이 있으면 뒤이은 조회 실패로 지우지 않는다 — 다시 부르는 중에도 책은 그대로 보인다.
   */
  const renderBookHeader = () => {
    if (book) {
      return (
        <BookItem
          author={book.author}
          coverImageUrl={book.coverImageUrl}
          opinionCount={book.opinionCount}
          passageCount={book.passageCount}
          publisher={book.publisher}
          statusBadge={
            <BookStatusChip
              status={savedStatus}
              onClick={() => {
                setStatusDraft(savedStatus)
                setIsStatusOpen(true)
              }}
            />
          }
          title={book.title}
        />
      )
    }
    // 4xx는 다시 보내지 않으므로(queryClient.service) 골격으로 두면 영원히 골격이다.
    // 독서 상태 시트로 가는 유일한 손잡이도 이 자리에 있어, 다시 부를 길을 반드시 남긴다.
    if (bookQuery.isError) {
      return (
        <RetryMessage
          message="책 정보를 불러오지 못했어요"
          onRetry={() => {
            void bookQuery.refetch()
          }}
        />
      )
    }
    return <BookHeaderSkeleton />
  }

  /** 붙잡아 둔 종류로 안내 한 벌을 편다. 퇴장 중에는 문구만 비고 모양은 그대로다. */
  const buildNotice = (): Notice => {
    if (noticeKind === 'unliked') {
      return {
        message: unliked ? `${unliked.nickname}님의 좋아요를 해제했어요` : '',
        actionLabel: '취소',
        onAction: () => {
          unliked?.undo()
          setUnliked(null)
        },
        onClose: () => {
          setUnliked(null)
        },
      }
    }
    if (noticeKind === 'release') {
      return { message: release.errorMessage, onClose: release.clearError }
    }
    return {
      message: noticeKind === 'status' ? statusError : '',
      onClose: () => {
        setStatusError('')
      },
    }
  }

  return (
    <>
      <ScreenLayout title="내 서재" action={<BookEditAction />}>
        <Tabs.Root
          value={tab}
          onValueChange={(next) => {
            setTab(next as BookRecordTab)
            // 탭을 바꾸면 되돌릴 카드도 열어 둔 대상도 화면에서 사라진다 — 안내를 함께 접는다
            setUnliked(null)
            release.close()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* 셸(TopBar·탭)은 데이터를 기다리지 않는다 — 책 머리 자리만 골격·오류로 채운다 */}
          <div className="shrink-0 px-4 pt-2">{renderBookHeader()}</div>

          {/* 스크롤하면 위 책 머리가 걷히고 이 줄만 상단에 남는다 */}
          <div className="sticky top-0 z-10 flex shrink-0 justify-center bg-bg-default p-2">
            <BookRecordTabs />
          </div>

          {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다.
            Tabs.Panel은 고르지 않은 쪽을 떼어 두므로(keepMounted 기본값) 활성 탭의 쿼리만 나간다. */}
          <Tabs.Panel value="opinion" className={PANEL_CLASS}>
            <OpinionPanel bookId={bookId} />
          </Tabs.Panel>
          <Tabs.Panel value="like" className={PANEL_CLASS}>
            <LikedPanel
              bookId={bookId}
              onUnlike={(target) => {
                clearNotices()
                setUnliked(target)
              }}
            />
          </Tabs.Panel>
          <Tabs.Panel value="spoiler" className={PANEL_CLASS}>
            <SpoilerPanel
              bookId={bookId}
              onRelease={(passage) => {
                clearNotices()
                release.start(passage)
              }}
            />
          </Tabs.Panel>
        </Tabs.Root>
      </ScreenLayout>

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar tone="light" {...buildNotice()} />

      <BookStatusSheet
        open={isStatusOpen}
        value={statusDraft}
        // 고른 값이 이미 저장된 값이면 보낼 것이 없다 — 상태 없음에서 아무것도 고르지 않은 경우도 여기 걸린다
        saveDisabled={statusDraft === savedStatus}
        saving={saveStatus.isPending}
        onChange={setStatusDraft}
        onClose={() => {
          setIsStatusOpen(false)
        }}
        onSave={handleSaveStatus}
      />

      <SpoilerReleaseDialog
        open={release.target !== null}
        releasing={release.isPending}
        onCancel={release.close}
        onConfirm={release.confirm}
      />
    </>
  )
}
