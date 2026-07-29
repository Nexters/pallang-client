/* 종이 폭만 따로 타이밍을 줄 수 있게 분리한 진행률 식(CSS 값).
   기울기·상승·높이·배너·탭은 재조판과 무관해 전부 --collapse를 그대로 따르고,
   유일하게 줄바꿈을 다시 계산하게 만드는 폭 변화만 시안별로 이 식이 달라진다. */
export const WIDTH_TIMING = {
  /** A안 — 스크롤과 1:1. 전 구간에 걸쳐 줄바꿈이 계속 다시 잡힌다 */
  continuous: 'var(--collapse)',
  /** C안 — 전환이 끝나는 순간에만 계단식으로 바뀐다. 재조판 1회, 셔틀림 0 */
  endSnap: 'clamp(0, calc((var(--collapse) - 0.999) * 1000), 1)',
  /** D안 — 뒤 25% 구간에서만 폭이 벌어진다. 전반부는 폭이 완전히 멈춰 있다 */
  lateBurst: 'clamp(0, calc((var(--collapse) - 0.75) * 4), 1)',
  /** E안 — 세제곱 이징. 계단 없이 부드럽되 변화가 후반에 몰린다 */
  lateEase: 'calc(var(--collapse) * var(--collapse) * var(--collapse))',
} as const
