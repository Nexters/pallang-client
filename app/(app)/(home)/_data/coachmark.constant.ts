import {
  COACHMARK_TARGET,
  type CoachmarkTargetName,
} from '@/app/_global/_data/coachmarkTarget.constant'

export type CoachmarkStep = {
  /** 마지막 단계만 '확인'이다 — 시안 그대로. */
  actionLabel: string
  description: string
  /** 구멍 모서리 반경(px). 비추는 엘리먼트의 실제 모양을 따라간다. */
  holeRadius: number
  /** 앞에서부터 찾아 처음 잡히는 마커를 쓴다. 같은 마커가 여럿이면 그 합집합이 구멍이 된다. */
  targets: [CoachmarkTargetName, ...CoachmarkTargetName[]]
}

export const HOME_COACHMARK_STEPS: [CoachmarkStep, ...CoachmarkStep[]] = [
  {
    actionLabel: '다음',
    description: '+ 버튼을 클릭 해 현재 읽고 있거나, 완독한 책에 의견을 남길 수 있어요.',
    // "+" 버튼은 rounded-full이다. 브라우저가 높이의 절반으로 잘라 주므로 큰 값을 그대로 넘긴다.
    holeRadius: 9999,
    targets: [COACHMARK_TARGET.traceCreate],
  },
  {
    actionLabel: '다음',
    description:
      '내가 남긴 책들은 메인에서 확인할 수 있어요. 클릭 시 다른 사람이 남긴 의견도 확인하고 서로 의견을 나눌 수 있는 페이지로 넘어가요.',
    // 책 카드가 rounded-sm(4px)이라 구멍도 같은 값으로 맞춘다.
    holeRadius: 4,
    // 아직 흔적을 남긴 책이 없으면 비출 카드가 없다 — 그 자리의 빈 상태 영역을 대신 비춘다.
    targets: [COACHMARK_TARGET.homeActiveBook, COACHMARK_TARGET.homeLibrary],
  },
  {
    actionLabel: '확인',
    description:
      '내가 남긴 책 외의 모든 책들은 “탐색”에서 확인할 수 있어요. 다른 의견들을 확인해보면서 생각을 넓혀가보세요!',
    holeRadius: 8,
    targets: [COACHMARK_TARGET.bookExplore],
  },
]
