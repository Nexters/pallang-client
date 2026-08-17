'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { type ReactNode, useRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import BackIcon from '../Icon/assets/back.svg'
import CloseIcon from '../Icon/assets/close.svg'

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
  /** 본문 아래 고정 영역. 본문이 안에서 스크롤돼도 딸려 올라가지 않는다 */
  footer?: ReactNode
}

// Dialog와 같은 base-ui 프리미티브 위에 올린다 — 포커스 트랩·스크롤 락·Esc·바깥 탭 닫힘을
// 직접 만들지 않기 위함이다. 바깥에 노출하는 props는 손수 구현하던 시절과 같게 유지한다.
// 포털로 body 끝에 렌더되므로 z는 Dialog와 같은 z-50으로 맞춘다.
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
  footer,
}: BottomSheetProps) {
  const isDark = tone === 'dark'
  // base-ui의 기본 initialFocus는 터치로 열 때만 팝업 자신을, 그 외에는 첫 tabbable 요소를 잡는다
  // — 시트가 열리자마자 닫기 버튼에 포커스 링이 뜬다. 항상 팝업 자신을 잡는다(Dialog.Popup과 같은 이유).
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          data-slot="bottom-sheet-backdrop"
          className={cn(
            'fixed inset-0 z-50 bg-bg-black/50 transition-opacity duration-fast ease-enter',
            'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:ease-exit',
          )}
        />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex flex-col justify-end">
          <BaseDialog.Popup
            data-slot="bottom-sheet-popup"
            ref={popupRef}
            initialFocus={popupRef}
            className={cn(
              // 모서리 24px — 의견 시트 시안(202:7290)의 comment_Area 값이다
              'relative flex flex-col rounded-t-3xl pt-6 pb-safe',
              isDark ? 'bg-bg-dark' : 'bg-bg-default',
              // 포커스를 받는 요소가 되므로 키보드로 열었을 때 링이 그려지지 않게 막는다
              'outline-none',
              'transition-transform duration-normal ease-enter',
              'data-starting-style:translate-y-full data-ending-style:translate-y-full',
              'data-ending-style:duration-fast data-ending-style:ease-exit',
              popupClassName,
            )}
            // 홈 인디케이터에 시트 내용이 가리지 않게 한다
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              {(onBack !== undefined || reserveBackSlot) && (
                <button
                  type="button"
                  aria-label="뒤로"
                  // 자리만 지키는 동안에는 보이지도, 포커스·보조기기에 잡히지도 않는다
                  aria-hidden={onBack ? undefined : true}
                  tabIndex={onBack ? undefined : -1}
                  onClick={onBack}
                  // 나타나고 사라지는 opacity 전환은 press 유틸의 transition이 함께 다룬다
                  // (transition-*을 덧붙이면 press의 transition-property를 덮어 눌림 스케일이 죽는다)
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
            {/* 시안의 시트는 본문이 자기 여백을 가진다 — 패널은 가로 여백을 두지 않는다 */}
            <div
              data-slot="bottom-sheet-body"
              className={cn('flex flex-col gap-4 p-4', contentClassName)}
            >
              {children}
            </div>
            {/* 스크롤 영역 바깥이라 본문이 밀려 올라가도 그대로 붙어 있다 */}
            {footer && <div className="shrink-0 px-4 pb-2">{footer}</div>}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
