'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'
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
      setTarget(null)
      setMessage('차단이 해제되었습니다.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blockQueries.all() }),
        // 해제한 사용자의 흔적·댓글이 목록에 다시 보이려면 새로 받아와야 한다
        queryClient.invalidateQueries({ queryKey: opinionQueries.all() }),
        queryClient.invalidateQueries({ queryKey: commentQueries.all() }),
      ])
    },
    onError: () => {
      setTarget(null)
      setMessage('차단을 해제하지 못했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <BlockedUsersSkeleton />
    if (listQuery.isError && users.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-10 text-body-14rg text-text-tertiary">
          <p>차단 목록을 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => {
              void listQuery.refetch()
            }}
            className="text-body-14sb text-text-secondary underline"
          >
            다시 불러오기
          </button>
        </div>
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
                // 외부 이미지 도메인이 유동적이라 next/image 대신 img 사용
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <Image
                  src="/images/profile-character-gray.png"
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
                onClick={() => {
                  setTarget(user)
                }}
                className="flex h-8 w-16 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-default text-center text-title-12bd text-text-tertiary press"
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

/** 목록과 같은 좌표(프로필 32px + 행 py-4 + 구분선)로 자리를 지킨다 */
function BlockedUsersSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-2 border-b border-border-default py-4">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  )
}
