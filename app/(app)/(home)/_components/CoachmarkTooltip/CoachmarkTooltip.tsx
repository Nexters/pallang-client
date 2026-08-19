import { cn } from '@/app/_global/_services/cn.service'

type CoachmarkTooltipProps = {
  actionLabel: string
  className?: string
  description: string
  /** 오버레이 기준 위치. 높이를 몰라도 되도록 top이 아니라 bottom으로 잡는다. */
  position: { bottom: number; left: number }
  stepCount: number
  stepIndex: number
  /** 말풍선 왼쪽 끝에서 꼬리까지의 거리(px) */
  tailLeft: number
  onAction: () => void
}

export function CoachmarkTooltip({
  actionLabel,
  className,
  description,
  position,
  stepCount,
  stepIndex,
  tailLeft,
  onAction,
}: CoachmarkTooltipProps) {
  return (
    // 꼬리를 흐름 안에 두어야 컨테이너 높이에 꼬리가 포함되고, 그래야 bottom이 꼬리 끝을 가리킨다.
    <div className={cn('absolute flex w-62.5 flex-col', className)} style={position}>
      <div className="flex flex-col gap-2 rounded-lg bg-bg-dark px-4 py-3">
        <p className="text-body-14rg font-medium text-text-inverse">{description}</p>

        <div className="flex items-center justify-between">
          <span className="text-caption-12rg text-text-inverse/50">
            {stepIndex + 1}/{stepCount}
          </span>
          <button
            type="button"
            className="press rounded-2xl bg-interactive-accent px-2 py-1 text-caption-12rg text-text-inverse"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      </div>

      {/* 시안에서 export한 꼬리(20×14, 끝이 둥근 삼각형). 말풍선을 4px 파고들어 이음매를 지운다. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 14"
        fill="currentColor"
        className="-mt-1 h-3.5 w-5 shrink-0 text-bg-dark"
        style={{ marginLeft: tailLeft }}
      >
        <path
          transform="rotate(180 10 7) translate(1.883 1.441)"
          d="M6.48968 0.837524C7.28732 -0.279174 8.94697 -0.279175 9.74461 0.837523L15.8582 9.39659C16.8038 10.7203 15.8575 12.5591 14.2308 12.5591H2.00353C0.376781 12.5591 -0.569467 10.7203 0.376059 9.39659L6.48968 0.837524Z"
        />
      </svg>
    </div>
  )
}
