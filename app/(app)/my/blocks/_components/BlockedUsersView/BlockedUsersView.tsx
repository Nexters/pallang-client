'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import type { BlockedUserResponse } from '@/app/_global/_queries/block.queries'
import { blockMutations, blockQueries } from '@/app/_global/_queries/block.queries'
import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { opinionQueries } from '@/app/_global/_queries/opinion.queries'

const AVATAR_SIZE = 32

export function BlockedUsersView() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<BlockedUserResponse | null>(null)
  // 다이얼로그가 닫히는 동안에도 문구가 비지 않아야 한다
  const shownTarget = useLastPresent(target)

  const listQuery = useInfiniteQuery(blockQueries.list())
  const users = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.data?.users ?? []) ?? [],
    [listQuery.data],
  )

  const unblock = useMutation({
    ...blockMutations.unblock(),
    onSuccess: async () => {
      // 목록이 갱신된 뒤에 닫는다 — 먼저 닫으면 해제된 행이 남아 있어 같은 사용자에게 DELETE가 한 번 더 간다
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blockQueries.all() }),
        // 해제한 사용자의 흔적·댓글이 목록에 다시 보이려면 새로 받아와야 한다
        queryClient.invalidateQueries({ queryKey: opinionQueries.all() }),
        queryClient.invalidateQueries({ queryKey: commentQueries.all() }),
      ])
      setTarget(null)
      setMessage('차단이 해제되었습니다.')
    },
    onError: () => {
      setTarget(null)
      setMessage('차단을 해제하지 못했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <BlockedUsersSkeleton />
    // 캐시가 살아 있는 채로 백그라운드 refetch만 실패하면 목록을 지우지 않는다
    if (listQuery.isError && users.length === 0) {
      return (
        <RetryMessage
          message="차단 목록을 불러오지 못했어요."
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    if (users.length === 0) {
      return (
        <p className="py-10 text-center text-body-14rg text-text-tertiary">
          차단한 사용자가 없어요
        </p>
      )
    }
    return (
      <>
        <ul className="flex flex-col">
          {users.map((user) => (
            <li
              key={user.userId}
              className="flex items-center gap-2 border-b border-border-default py-4"
            >
              {user.profileImageUrl ? (
                // 프로필 이미지 도메인이 유동적이라(카카오 CDN 등) next/image 대신 img 사용 — 크기·지연 로드만 정비
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImageUrl}
                  alt=""
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  loading="lazy"
                  decoding="async"
                  className="size-8 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <Image
                  src="/images/profile-character-gray.webp"
                  alt=""
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  className="shrink-0 rounded-lg"
                />
              )}
              <span className="min-w-0 flex-1 truncate text-body-16bd text-text-primary">
                {user.nickname}
              </span>
              <button
                type="button"
                // 행마다 라벨이 같아 스크린리더에서 어느 사용자인지 구분되지 않는다
                aria-label={`${user.nickname}님 차단 해제`}
                // 해제 요청이 도는 동안은 잠근다 — 목록이 갱신되기 전이라 이미 해제된 행이 남아 있다
                disabled={unblock.isPending}
                onClick={() => {
                  setTarget(user)
                }}
                className="flex h-8 w-16 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-default text-center text-title-12bd text-text-tertiary press disabled:text-text-disabled"
              >
                차단 해제
              </button>
            </li>
          ))}
        </ul>
        {listQuery.hasNextPage && (
          <button
            type="button"
            disabled={listQuery.isFetchingNextPage}
            onClick={() => {
              void listQuery.fetchNextPage()
            }}
            className="w-full py-3 text-center text-body-14rg text-text-tertiary"
          >
            더보기
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <ScreenLayout title="차단 유저 관리" bodyClassName="px-4">
        {renderList()}
      </ScreenLayout>

      {/* 설명은 시안이 정한 자리에서 줄을 바꾼다 — Dialog.Description이 pre-line이다 */}
      <FlatDialog
        open={target !== null}
        title={`${shownTarget?.nickname ?? ''}님의 차단을 해제하시겠어요?`}
        description={`차단 해제 시 ${shownTarget?.nickname ?? ''}님이 작성하신\n댓글을 확인할 수 있어요`}
        cancelLabel="뒤로"
        confirmLabel="차단 해제"
        loading={unblock.isPending}
        illustrated={false}
        // 요청 중에 닫아도 안전하다 — 목록 행이 함께 잠겨 있어 중복 요청으로 이어지지 않는다
        onCancel={() => {
          setTarget(null)
        }}
        onConfirm={() => {
          if (target) unblock.mutate(target.userId)
        }}
      />

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar
        tone="light"
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </>
  )
}

/** 목록과 같은 좌표(프로필 32px + 닉네임 + 우측 해제 칩 h-8 w-16 + 행 py-4 + 구분선)로 자리를 지킨다 */
function BlockedUsersSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-2 border-b border-border-default py-4">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="ml-auto h-8 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}
