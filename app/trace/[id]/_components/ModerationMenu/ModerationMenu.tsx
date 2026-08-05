'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import MeatballsMenuIcon from '@/app/_global/_components/Icon/assets/meatballs-menu.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { blockMutations, blockQueries } from '@/app/_global/_queries/block.queries'
import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { opinionQueries } from '@/app/_global/_queries/opinion.queries'
import { reportMutations } from '@/app/_global/_queries/report.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { BlockConfirmDialog } from '../BlockConfirmDialog/BlockConfirmDialog'
import { ReportSheet } from '../ReportSheet/ReportSheet'

type ModerationMenuProps = {
  /** 신고 대상 — 흔적이면 opinionId, 댓글이면 commentId */
  target: { type: 'opinion' | 'comment'; id: number }
  authorUserId: number
  authorNickname: string
}

/**
 * 흔적·댓글의 ⋯ 메뉴 — 신고 시트와 차단 확인 다이얼로그, 결과 스낵바까지 소유한다.
 * 내 글에는 그리지 않는다(서버도 본인 신고·차단을 4xx로 거부한다).
 * 두 액션 모두 로그인 게이트를 지나야 시트/다이얼로그가 열린다.
 */
export function ModerationMenu({ target, authorUserId, authorNickname }: ModerationMenuProps) {
  const runWithLogin = useLoginGate()
  const queryClient = useQueryClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  const [message, setMessage] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const menu = useExitTransition(isMenuOpen, MOTION_DURATION.fast)

  // 비로그인이면 me가 없어 모두 남의 글로 본다 — 액션은 어차피 로그인 게이트가 막는다
  const { data: meData } = useQuery(userQueries.me())
  const myUserId = meData?.data?.userId

  const report = useMutation({
    ...(target.type === 'opinion'
      ? reportMutations.opinion(target.id)
      : reportMutations.comment(target.id)),
    onSuccess: () => {
      setIsReportOpen(false)
      setMessage('신고가 접수됐어요.')
    },
    onError: (error) => {
      // 실패 안내는 스낵바가 맡는데 시트(z-50)가 남아 있으면 스낵바가 백드롭에 가린다 — 함께 닫는다
      setIsReportOpen(false)
      // 4xx는 본인 글이거나 이미 신고한 글 — 다시 시도해도 결과가 같다
      setMessage(
        error instanceof ApiError && error.status >= 400 && error.status < 500
          ? '이미 신고했거나 신고할 수 없는 글이에요.'
          : '신고하지 못했어요. 잠시 후 다시 시도해주세요.',
      )
    },
  })

  const blockUser = useMutation({
    ...blockMutations.block(),
    onSuccess: async () => {
      setIsBlockOpen(false)
      setMessage('차단했어요.')
      // 로그인 상태의 흔적·댓글 목록은 서버가 차단 사용자의 글을 걸러 준다 — 다시 받아와야 사라진다
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: opinionQueries.all() }),
        queryClient.invalidateQueries({ queryKey: commentQueries.all() }),
        queryClient.invalidateQueries({ queryKey: blockQueries.all() }),
      ])
    },
    onError: () => {
      setIsBlockOpen(false)
      setMessage('차단하지 못했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  // 바깥 탭·스크롤이 일어나면 닫는다. 이 effect는 메뉴를 연 pointerdown이 끝난 뒤 붙으므로
  // 열자마자 스스로 닫히지 않는다.
  useEffect(() => {
    if (!isMenuOpen) return undefined
    const closeOnOutside = (event: PointerEvent) => {
      const eventTarget = event.target instanceof Element ? event.target : null
      if (rootRef.current?.contains(eventTarget)) return
      setIsMenuOpen(false)
    }
    const close = () => {
      setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('scroll', close, true)
    }
  }, [isMenuOpen])

  // 내 글에는 신고·차단이 성립하지 않는다 — 메뉴 자체를 그리지 않는다
  if (myUserId !== undefined && myUserId === authorUserId) return null

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => {
          setIsMenuOpen((prev) => !prev)
        }}
        className="press flex size-6 items-center justify-center"
      >
        <MeatballsMenuIcon width={20} height={20} className="text-icon-active" />
      </button>
      {menu.shouldRender && (
        <div
          role="menu"
          aria-label="더보기 메뉴"
          data-state={menu.state}
          className={cn(
            // Figma 2248:3299 필터 드롭다운 패턴 — 어두운 패널(#383838 = bg-bg-overlay).
            // 댓글 카드도 같은 색이라 경계가 사라지지 않게 ring과 그림자를 더한다.
            'absolute top-full right-0 z-10 mt-1 flex min-w-28 flex-col rounded-lg bg-bg-overlay p-1 shadow-lg ring-1 ring-white/10',
            'origin-top-right transition-[opacity,scale] duration-fast ease-enter',
            'data-[state=entering]:scale-95 data-[state=entering]:opacity-0',
            'data-[state=exiting]:scale-95 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
            // 사라지는 동안에도 화면에 남아 있으므로 탭을 흘려보낸다
            'data-[state=exiting]:pointer-events-none',
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false)
              runWithLogin(() => {
                setIsReportOpen(true)
              }, LOGIN_GATE_MESSAGE.report)
            }}
            className="press flex h-8 items-center rounded px-2 text-left text-body-14rg text-text-inverse"
          >
            신고하기
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false)
              runWithLogin(() => {
                setIsBlockOpen(true)
              }, LOGIN_GATE_MESSAGE.block)
            }}
            className="press flex h-8 items-center rounded px-2 text-left text-body-14rg text-text-inverse"
          >
            차단하기
          </button>
        </div>
      )}
      <ReportSheet
        open={isReportOpen}
        loading={report.isPending}
        onClose={() => {
          setIsReportOpen(false)
        }}
        onSubmit={(request) => {
          report.mutate(request)
        }}
      />
      <BlockConfirmDialog
        open={isBlockOpen}
        nickname={authorNickname}
        loading={blockUser.isPending}
        onClose={() => {
          setIsBlockOpen(false)
        }}
        onConfirm={() => {
          blockUser.mutate(authorUserId)
        }}
      />
      {/* 스낵바는 화면 하단 기준으로 떠야 한다 — 팝오버의 relative 래퍼에 잡히지 않게
          높이 0의 fixed 앵커를 깔고 그 안에서 absolute로 자리를 잡는다 */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <Snackbar
          message={message}
          onClose={() => {
            setMessage('')
          }}
        />
      </div>
    </div>
  )
}
