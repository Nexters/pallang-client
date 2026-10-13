'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useSheetDragDismiss } from '@/app/_global/_hooks/useSheetDragDismiss'
import { cn } from '@/app/_global/_services/cn.service'

import BackIcon from '../Icon/assets/back.svg'
import CloseIcon from '../Icon/assets/close.svg'
import { SheetHandle } from '../SheetHandle/SheetHandle'

type BottomSheetProps = {
  open: boolean
  /** 문자열이 기본. 시트 안 화면 전환에 맞춰 제목을 연출해야 하면 노드를 넘긴다 */
  title: ReactNode
  onClose: () => void
  children: ReactNode
  /** 시트 표면 색. 어두운 화면(흔적 페이지 등) 위에 뜨는 시트는 dark를 쓴다 */
  tone?: 'light' | 'dark'
  /** 넘기면 제목 앞에 뒤로가기 버튼이 붙는다 — 시트 안에서 화면을 겹쳐 쓸 때 상위로 돌아가는 길 */
  onBack?: () => void
  /** onBack이 사라져도 뒤로가기 자리를 유지한다 — 버튼이 오가며 제목이 좌우로 튀지 않게 */
  reserveBackSlot?: boolean
  /** 본문 래퍼(flex flex-col gap-4 p-4)를 덮어쓸 때 쓴다 — 시트 안에서 자체 스크롤 영역을 잡는 경우 */
  contentClassName?: string
  /** 시트 패널 자체에 덧붙일 클래스 — 기본은 내용 높이만큼이고, 높이를 고정하고 싶을 때 쓴다 */
  popupClassName?: string
  /** 높이 같은 계산값을 넘길 때 — 상수에서 만든 calc()는 클래스로 쓰면 Tailwind가 못 본다 */
  popupStyle?: CSSProperties
  /** 끄면 백드롭이 투명해지되 바깥 탭 닫힘·뒤쪽 조작 차단은 남는다 — 어두운 시트 위에 겹치는 시트용 */
  dim?: boolean
  /** 제목 위에 손잡이를 세우고 끌어 닫기를 켠다(없으면 끌리지 않는다). dim=false 시트의 내리는 길 */
  showHandle?: boolean
  /** 본문 아래 고정 영역. 본문이 안에서 스크롤돼도 딸려 올라가지 않는다 */
  footer?: ReactNode
  /** 바뀌면 패널만 다시 꽂혀 등장 전환을 탄다(백드롭 유지) — 시트 안 화면 전환용, 시트 두 개면 교차한다 */
  panelKey?: string
}

// base-ui Dialog 위에 올린다 — 포커스 트랩·스크롤 락·Esc·바깥 탭 닫힘이 딸려 온다. z는 Dialog와 같은 z-50.
export function BottomSheet({
  open,
  title,
  onClose,
  children,
  tone = 'light',
  onBack,
  reserveBackSlot = false,
  contentClassName,
  popupClassName,
  popupStyle,
  footer,
  panelKey,
  dim = true,
  showHandle = false,
}: BottomSheetProps) {
  const isDark = tone === 'dark'
  // initialFocus를 팝업 자신으로 — 기본값은 첫 tabbable(닫기 버튼)에 포커스 링을 띄운다
  const popupRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<BaseDialog.Root.Actions>(null)
  const bindSheetDrag = useSheetDragDismiss(onClose, { enabled: showHandle })

  // 닫힘 안전망(#406). 퇴장은 CSS 전환이 끝나야 base-ui가 시트를 언마운트하는 구조인데,
  // 전환이 시작되지 못하거나(드래그가 남긴 인라인 transition이 덮는 경우) 완료를 알리지
  // 못하면 투명 백드롭(fixed inset-0)이 화면 전체 입력을 삼킨 채 영구히 남는다 — 실기기
  // 터치에서 시트를 닫은 뒤 화면 전체가 안 눌리는 형태로 나타난다. 닫힘이 시작되면 인라인
  // 잔재를 걷어 전환을 살리고, 퇴장이 끝났어야 할 시점에도 남아 있으면 강제로 걷는다.
  useEffect(() => {
    if (open) return undefined
    const popup = popupRef.current
    if (popup) {
      popup.style.transition = ''
      // 백드롭은 포털 노드 아래 Viewport(→Popup)의 형제다(useSheetDragDismiss와 같은 경로)
      const backdrop = popup.parentElement?.parentElement?.querySelector<HTMLElement>(
        ':scope > [data-slot="bottom-sheet-backdrop"]',
      )
      if (backdrop) backdrop.style.transition = ''
    }
    // rise(가장 긴 시트 전환이 진행 중이었을 때) + fast(퇴장) 뒤에는 반드시 끝나 있어야 한다.
    // 이미 언마운트됐으면 unmount()는 아무 일도 하지 않는다.
    const timer = setTimeout(() => {
      actionsRef.current?.unmount()
    }, MOTION_DURATION.rise + MOTION_DURATION.fast)
    return () => {
      clearTimeout(timer)
    }
  }, [open])

  // 등장 시작값은 base-ui의 data-starting-style과 CSS @starting-style(starting:) 둘 다에 건다 —
  // 열린 채로 마운트되는 경로(TraceSourceView)에서는 base-ui가 'starting'을 건너뛴다.
  // 시작·종료값은 translate 유틸 대신 직접 값([translate:0_100%])으로 쓴다: iOS Safari는
  // @starting-style 안의 var() 조립 translate를 시작값으로 잡지 못한다(AGENTS.md 모션 참고, #309).

  return (
    <BaseDialog.Root
      open={open}
      actionsRef={actionsRef}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          data-slot="bottom-sheet-backdrop"
          className={cn(
            'fixed inset-0 z-50 transition-opacity duration-fast ease-enter',
            dim && 'bg-bg-black/50',
            'starting:opacity-0 data-starting-style:opacity-0',
            'data-ending-style:opacity-0 data-ending-style:ease-exit',
          )}
        />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex flex-col justify-end">
          <BaseDialog.Popup
            key={panelKey}
            data-slot="bottom-sheet-popup"
            ref={popupRef}
            initialFocus={popupRef}
            {...bindSheetDrag()}
            className={cn(
              // 모서리 32px — v2 시트 시안 공통값(3321:30402)
              'relative flex flex-col rounded-t-4xl pb-safe',
              showHandle ? 'pt-0' : 'pt-6',
              isDark ? 'bg-bg-dark' : 'bg-bg-default',
              'outline-none',
              // 먼 거리 등장 토큰 — ease-enter는 2프레임 만에 62%가 끝나 번쩍인다
              'transition-transform duration-rise ease-rise',
              'starting:[translate:0_100%] data-starting-style:[translate:0_100%]',
              'data-ending-style:[translate:0_100%]',
              'data-ending-style:duration-fast data-ending-style:ease-exit',
              popupClassName,
            )}
            style={popupStyle}
          >
            {showHandle && <SheetHandle label="시트 내리기" onSelect={onClose} />}
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              {(onBack !== undefined || reserveBackSlot) && (
                <button
                  type="button"
                  aria-label="뒤로"
                  aria-hidden={onBack ? undefined : true}
                  tabIndex={onBack ? undefined : -1}
                  onClick={onBack}
                  // transition-*을 덧붙이지 않는다 — press의 transition-property를 덮어 눌림 스케일이 죽는다
                  className={cn(
                    'press flex size-6 shrink-0 items-center justify-center',
                    isDark ? 'text-icon-active' : 'text-icon-primary',
                    !onBack && 'pointer-events-none opacity-0',
                  )}
                >
                  <BackIcon aria-hidden="true" className="size-6" />
                </button>
              )}
              <BaseDialog.Title
                className={cn(
                  'min-w-px flex-1 text-title-18bd',
                  isDark ? 'text-text-inverse' : 'text-text-secondary',
                )}
              >
                {title}
              </BaseDialog.Title>
              <BaseDialog.Close
                aria-label="닫기"
                className={cn(
                  'flex size-6 shrink-0 cursor-pointer items-center justify-center',
                  isDark ? 'text-icon-active' : 'text-icon-primary',
                )}
              >
                <CloseIcon
                  aria-hidden="true"
                  className={cn('size-6', isDark ? 'text-icon-active' : 'text-icon-primary')}
                />
              </BaseDialog.Close>
            </div>
            <div
              data-slot="bottom-sheet-body"
              className={cn('flex flex-col gap-4 p-4', contentClassName)}
            >
              {children}
            </div>
            {footer && <div className="shrink-0 px-4 pb-2">{footer}</div>}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
