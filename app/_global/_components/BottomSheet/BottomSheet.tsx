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

  // 시트가 "열린 채로" DOM에 꽂히는 경로가 있다 — 화면 자체가 시트인 첫 화면(TraceSourceView)이
  // 그렇고, 탭바로 들어오면 특히 그렇다. base-ui는 mounted 초기값을 open으로 잡아
  // (internals/useTransitionStatus) 그 경우 'starting'을 건너뛴다 = data-starting-style이 한 번도
  // 붙지 않아 시작 위치를 거치지 않고 제자리에 그려진다. 올라오는 전환이 통째로 사라진다.
  //
  // React 쪽에서 한 렌더 유예를 만드는 방법은 전부 새는 길이 있었다. useDeferredValue(true, false)는
  // URL 직접 로드에서만 유예가 걸리고 router.push 경로에서는 첫 렌더부터 true가 나온다. 렌더 중
  // 상태 갱신은 마운트를 통째로 다시 돌려 base-ui가 또 열린 채로 초기화된다. effect+setState는
  // lint가 막는다(react-hooks/set-state-in-effect).
  //
  // 그래서 유예를 없애고 CSS에 맡긴다. @starting-style(Tailwind의 starting: 변형)은 "이 요소가
  // 처음 그려질 때의 시작값"을 브라우저가 직접 잡아주는 규칙이라 React가 언제 커밋하든 상관없다.
  // base-ui의 data-starting-style은 열림이 런타임에 토글되는 경로에서 그대로 동작하고,
  // starting:은 열린 채 꽂히는 경로를 받는다 — 둘은 같은 시작값이라 겹쳐도 무해하다.
  //
  // 단 시작값을 Tailwind의 translate 유틸로 쓰면 안 된다. translate-y-full은 값을 직접
  // 내지 않고 --tw-translate-* 를 거쳐 translate:var(--tw-translate-x) var(--tw-translate-y)
  // 로 조립하는데, iOS Safari(= iOS의 모든 브라우저)는 @starting-style 안에서 var()로 조립된
  // translate를 시작값으로 잡지 못한다. 실기기 판정 결과 — 직접값+@starting-style은 전환 발생,
  // var 조립+@starting-style은 전환 자체가 없음(2프레임 뒤에도 translate:none), var 조립이어도
  // 토글 경로는 정상. 그래서 @starting-style 쪽만 직접 값으로 낸다.

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
            'starting:opacity-0 data-starting-style:opacity-0',
            'data-ending-style:opacity-0 data-ending-style:ease-exit',
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
              // 시트는 화면 높이만큼 올라온다 — ease-enter로 그 거리를 옮기면 2프레임 만에 62%가
              // 끝나 번쩍이는 것으로 읽힌다(실기기에서 확인). 먼 거리 등장 전용 토큰을 쓴다.
              'transition-transform duration-rise ease-rise',
              'starting:[translate:0_100%] data-starting-style:translate-y-full',
              'data-ending-style:translate-y-full',
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
