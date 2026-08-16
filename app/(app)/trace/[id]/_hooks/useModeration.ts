'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { blockMutations, blockQueries } from '@/app/_global/_queries/block.queries'
import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { opinionQueries } from '@/app/_global/_queries/opinion.queries'
import type { ReportRequest } from '@/app/_global/_queries/report.queries'
import { reportMutations } from '@/app/_global/_queries/report.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { MODERATION_MESSAGE } from '../_data/moderation.constant'
import { isMine, resolveReportErrorMessage } from '../_services/moderation.service'
import { useModerationMessage } from './useModerationMessage'

/** 신고 대상 — 흔적이면 opinionId, 댓글이면 commentId */
export type ModerationTarget = { type: 'opinion' | 'comment'; id: number }

type UseModerationOptions = {
  target: ModerationTarget
  authorUserId: number
}

/**
 * 흔적·댓글의 신고와 글쓴이 차단을 한 묶음으로 다룬다 — 서버 상태(내 정보·두 mutation),
 * 다이얼로그 여닫힘, 결과 스낵바 문구까지 여기서 오간다. 컴포넌트는 그리기만 한다.
 *
 * 차단 성공 뒤 흔적·댓글 목록을 다시 받아오는 것은 서버가 걸러 주기 때문이다 —
 * 로그인 상태의 목록에서 차단 사용자의 글은 응답에 아예 오지 않는다.
 */
export function useModeration({ target, authorUserId }: UseModerationOptions) {
  const queryClient = useQueryClient()
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  // 결과 문구는 이 훅 바깥(ModerationMessageHost)에 맡긴다 — 차단이 성공하면 이 훅을 든
  // 카드가 목록에서 걷히므로, 여기에 들고 있으면 문구도 함께 사라진다
  const { show } = useModerationMessage()

  // 비로그인이면 me가 없어 모두 남의 글로 본다 — 액션은 어차피 로그인 게이트가 막는다
  const { data: meData } = useQuery(userQueries.me())
  const myUserId = meData?.data?.userId

  const report = useMutation({
    ...(target.type === 'opinion'
      ? reportMutations.opinion(target.id)
      : reportMutations.comment(target.id)),
    onSuccess: () => {
      setIsReportOpen(false)
      show(MODERATION_MESSAGE.reportSuccess)
    },
    onError: (error) => {
      // 실패 안내는 스낵바가 맡는데 시트(z-50)가 남아 있으면 스낵바가 백드롭에 가린다 — 함께 닫는다
      setIsReportOpen(false)
      show(resolveReportErrorMessage(error))
    },
  })

  const block = useMutation({
    ...blockMutations.block(),
    onSuccess: async () => {
      setIsBlockOpen(false)
      show(MODERATION_MESSAGE.blockSuccess)
      // 로그인 상태의 흔적·댓글 목록은 서버가 차단 사용자의 글을 걸러 준다 — 다시 받아와야 사라진다
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opinionQueries.all() }),
        queryClient.invalidateQueries({ queryKey: commentQueries.all() }),
        queryClient.invalidateQueries({ queryKey: blockQueries.all() }),
      ])
    },
    onError: () => {
      setIsBlockOpen(false)
      show(MODERATION_MESSAGE.blockFailure)
    },
  })

  return {
    /** 내 글에는 신고·차단이 성립하지 않는다 — 메뉴 자체를 그리지 않는다 */
    canModerate: !isMine(myUserId, authorUserId),
    report: {
      isOpen: isReportOpen,
      isPending: report.isPending,
      open: () => {
        setIsReportOpen(true)
      },
      close: () => {
        setIsReportOpen(false)
      },
      submit: (request: ReportRequest) => {
        report.mutate(request)
      },
    },
    block: {
      isOpen: isBlockOpen,
      isPending: block.isPending,
      open: () => {
        setIsBlockOpen(true)
      },
      close: () => {
        setIsBlockOpen(false)
      },
      confirm: () => {
        block.mutate(authorUserId)
      },
    },
  }
}
