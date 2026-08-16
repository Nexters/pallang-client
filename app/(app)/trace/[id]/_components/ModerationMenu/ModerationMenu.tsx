'use client'

import { useRef, useState } from 'react'

import MeatballsMenuIcon from '@/app/_global/_components/Icon/assets/meatballs-menu.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useDismissOnOutside } from '@/app/_global/_hooks/useDismissOnOutside'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'

import type { ModerationTarget } from '../../_hooks/useModeration'
import { useModeration } from '../../_hooks/useModeration'
import { BlockConfirmDialog } from '../BlockConfirmDialog/BlockConfirmDialog'
import { ReportDialog } from '../ReportDialog/ReportDialog'

type ModerationMenuProps = {
  target: ModerationTarget
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menu = useExitTransition(isMenuOpen, MOTION_DURATION.fast)
  const { canModerate, report, block, message } = useModeration({ target, authorUserId })

  useDismissOnOutside({
    ref: rootRef,
    enabled: isMenuOpen,
    onDismiss: () => {
      setIsMenuOpen(false)
    },
  })

  if (!canModerate) return null

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
              runWithLogin(report.open, LOGIN_GATE_MESSAGE.report)
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
              runWithLogin(block.open, LOGIN_GATE_MESSAGE.block)
            }}
            className="press flex h-8 items-center rounded px-2 text-left text-body-14rg text-text-inverse"
          >
            차단하기
          </button>
        </div>
      )}
      <ReportDialog
        open={report.isOpen}
        loading={report.isPending}
        onClose={report.close}
        onSubmit={report.submit}
      />
      <BlockConfirmDialog
        open={block.isOpen}
        nickname={authorNickname}
        loading={block.isPending}
        onClose={block.close}
        onConfirm={block.confirm}
      />
      {/* 스낵바는 화면 하단 기준으로 떠야 한다 — 팝오버의 relative 래퍼에 잡히지 않게
          높이 0의 fixed 앵커를 깔고 그 안에서 absolute로 자리를 잡는다 */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <Snackbar message={message.text} onClose={message.clear} />
      </div>
    </div>
  )
}
