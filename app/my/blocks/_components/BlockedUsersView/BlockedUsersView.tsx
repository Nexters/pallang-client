'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { blockMutations, blockQueries } from '@/app/_global/_queries/block.queries'
import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { opinionQueries } from '@/app/_global/_queries/opinion.queries'

// ponytail: 차단 관리 확정 디자인이 없다 — 마이페이지 톤(흰 배경·프로필 행)으로 만든 1차 구현.
export function BlockedUsersView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')

  const listQuery = useInfiniteQuery(blockQueries.list())
  const users = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.data?.users ?? []) ?? [],
    [listQuery.data],
  )

  const unblock = useMutation({
    ...blockMutations.unblock(),
    onSuccess: async () => {
      setMessage('차단을 해제했어요.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blockQueries.all() }),
        // 해제한 사용자의 흔적·댓글이 목록에 다시 보이려면 새로 받아와야 한다
        queryClient.invalidateQueries({ queryKey: opinionQueries.all() }),
        queryClient.invalidateQueries({ queryKey: commentQueries.all() }),
      ])
    },
    onError: () => {
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
            <li key={user.userId} className="flex items-center gap-3 py-3">
              {user.profileImageUrl ? (
                // 외부 이미지 도메인이 유동적이라 next/image 대신 img 사용
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <Image
                  src="/images/profile-character-gray.png"
                  alt=""
                  width={48}
                  height={48}
                  className="shrink-0 rounded-2xl"
                />
              )}
              <span className="min-w-0 flex-1 truncate text-body-16md text-text-secondary">
                {user.nickname}
              </span>
              <Button
                className="shrink-0 rounded-full px-4 py-2 text-body-14sb"
                loading={unblock.isPending && unblock.variables === user.userId}
                disabled={unblock.isPending}
                onClick={() => {
                  unblock.mutate(user.userId)
                }}
              >
                차단 해제
              </Button>
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
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      {/* 셸(TopBar)은 데이터를 기다리지 않는다 — 목록 자리만 골격으로 채운다 */}
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로 가기"
          onClick={() => {
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">차단 관리</TopBar.Title>
        <TopBar.Spacer />
      </TopBar.Root>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{renderList()}</div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </main>
  )
}

/** 목록과 같은 좌표(프로필 48px + 행 py-3)로 자리를 지킨다 */
function BlockedUsersSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-12 shrink-0 rounded-2xl" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  )
}
