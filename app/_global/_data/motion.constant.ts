/** 모션 duration(ms).
 *
 * globals.css의 `--duration-*` 와 반드시 같은 값이어야 한다 — CSS만 고치고 여기를 잊으면
 * 퇴장 애니메이션이 끝나기 전에 언마운트되거나 그 반대가 된다. motionToken.spec.ts가 둘을 맞춰 잠근다.
 *
 * CSS만으로 끝나지 않는 이유는 useExitTransition이 언마운트 시점을 타이머로 재기 때문이다.
 * 테스트 환경(happy-dom)에서는 CSS 전환이 실제로 돌지 않아 transitionend가 오지 않는다. */
export const MOTION_DURATION = {
  /** 프레스 피드백, 색 전환 */
  instant: 120,
  /** 백드롭, 토스트, 팝오버 */
  fast: 180,
  /** 모달·바텀시트 등장 */
  normal: 240,
  /** 전체화면 전환 */
  slow: 350,
} as const
