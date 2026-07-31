import { cn } from '@/app/_global/_services/cn.service'

type SpinnerProps = {
  /** 크기·색을 부르는 쪽에서 정한다. 기본은 부모 글자색(currentColor)을 따른다. */
  className?: string
}

/**
 * 처리 중을 알리는 회전 인디케이터.
 *
 * 모션 컨벤션은 등장/퇴장을 transition으로만 만들게 하지만, 무한 회전은 transition으로 표현할 수
 * 없어 빌트인 `animate-spin`을 쓴다. 우회가 아니다 — globals.css가 `--animate-spin`의 duration을
 * `--loop-duration-spin`으로 빼두어 움직임 축소 설정이 여기까지 닿는다.
 *
 * 장식이 아니라 상태 표시라 role/aria는 달지 않는다. "처리 중"은 이 아이콘을 품은 요소가
 * `aria-busy`로 알리고(Button 참고), 스피너 자신은 화면에만 존재한다.
 */
export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-5 animate-spin text-current', className)}
    >
      {/* 남은 궤도는 옅게 깔아 회전이 어디쯤인지 읽히게 한다 */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      {/* 원의 1/4만 그린다 — 호가 짧을수록 회전이 또렷하다 */}
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
