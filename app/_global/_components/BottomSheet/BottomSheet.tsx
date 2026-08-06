'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { type ReactNode, useRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import CloseIcon from '../Icon/assets/close.svg'

type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

// Dialog와 같은 base-ui 프리미티브 위에 올린다 — 포커스 트랩·스크롤 락·Esc·바깥 탭 닫힘을
// 직접 만들지 않기 위함이다. 바깥에 노출하는 props는 손수 구현하던 시절과 같게 유지한다.
// 포털로 body 끝에 렌더되므로 z는 Dialog와 같은 z-50으로 맞춘다.
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
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
              'relative flex flex-col rounded-t-[32px] bg-bg-default pt-6 pb-safe',
              // 포커스를 받는 요소가 되므로 키보드로 열었을 때 링이 그려지지 않게 막는다
              'outline-none',
              'transition-transform duration-normal ease-enter',
              'data-starting-style:translate-y-full data-ending-style:translate-y-full',
              'data-ending-style:duration-fast data-ending-style:ease-exit',
            )}
            // 홈 인디케이터에 시트 내용이 가리지 않게 한다
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <BaseDialog.Title className="min-w-px flex-1 text-title-18bd text-text-secondary">
                {title}
              </BaseDialog.Title>
              <BaseDialog.Close
                aria-label="닫기"
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-primary"
              >
                <CloseIcon aria-hidden="true" className="size-6 text-icon-primary" />
              </BaseDialog.Close>
            </div>
            {/* 시안의 시트는 본문이 자기 여백을 가진다 — 패널은 가로 여백을 두지 않는다 */}
            <div className="flex flex-col gap-4 p-4">{children}</div>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
