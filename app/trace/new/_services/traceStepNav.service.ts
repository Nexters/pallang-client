export type TraceStep = 'decorate' | 'detail' | 'done' | 'opinion' | 'photo' | 'search'

/** 뒤로가기가 향할 곳. exit는 플로우 자체를 벗어나는 것이라 이탈 판정을 한 번 더 거친다. */
export type TraceBackTarget =
  { clearQuote: boolean; step: TraceStep; type: 'step' } | { type: 'exit' }

const START = '/trace/new'

const STEP_PATH: Record<TraceStep, string> = {
  decorate: `${START}/decorate`,
  detail: `${START}/detail`,
  done: `${START}/done`,
  opinion: `${START}/opinion`,
  photo: `${START}/photo`,
  search: START,
}

const STEPS = Object.keys(STEP_PATH) as TraceStep[]

export function stepPath(step: TraceStep): string {
  return STEP_PATH[step]
}

/**
 * 각 단계에서 이어질 다음 단계(들). 미리 route를 프리페치해 '다음'을 눌렀을 때의
 * RSC 왕복을 없앤다. 이 왕복이 웹뷰(원격 URL)에서 단계 전환마다 버벅이는 원인이다.
 * search는 방식 선택에 따라 photo·detail 어느 쪽으로도 가므로 둘 다 미리 받는다.
 */
const NEXT_STEPS: Record<TraceStep, TraceStep[]> = {
  search: ['photo', 'detail'],
  photo: ['detail'],
  detail: ['decorate'],
  decorate: ['opinion'],
  opinion: ['done'],
  done: ['search'],
}

export function nextStepPaths(step: TraceStep): string[] {
  return NEXT_STEPS[step].map(stepPath)
}

export function resolveStep(pathname: string): TraceStep | null {
  return STEPS.find((step) => STEP_PATH[step] === pathname) ?? null
}

export function resolveBackTarget(step: TraceStep): TraceBackTarget {
  switch (step) {
    // 사진·직접입력 어느 쪽이든 방식 선택으로 되돌린다. photo로 되돌리면 카메라가 다시 열린다.
    case 'detail':
    case 'photo':
      return { clearQuote: true, step: 'search', type: 'step' }
    case 'decorate':
      return { clearQuote: false, step: 'detail', type: 'step' }
    case 'opinion':
      return { clearQuote: false, step: 'decorate', type: 'step' }
    case 'done':
    case 'search':
      return { type: 'exit' }
  }
}
