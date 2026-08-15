export type OnboardingStep = {
  /** 시안과 같은 지점에서 줄바꿈하도록 줄 단위로 나눈다 */
  titleLines: string[]
  descriptionLines: string[]
  imageSrc: string
  /** 시안(375 기준)의 표시 크기 — 3x export 원본을 이 크기로 내려 그린다 */
  imageWidth: number
  imageHeight: number
}

export const ONBOARDING_STEPS: [OnboardingStep, ...OnboardingStep[]] = [
  {
    titleLines: ['안녕하세요. 밤샘 낭독가님,', '교환 독서를 즐기러 오셨군요!'],
    descriptionLines: ['팔랑에서 다른 독자들의 생각을 확인하고,', '내 흔적도 남길 수 있어요.'],
    imageSrc: '/images/onboarding/onboarding-greeting.png',
    imageWidth: 279,
    imageHeight: 189,
  },
  {
    titleLines: ['사진을 통해 문장을 편하게', '발췌할 수 있어요.'],
    descriptionLines: [
      '의견을 남기고 싶은 문장을 사진으로',
      '찍고 발췌해보세요. 카메라로 찍으면',
      '자동으로 텍스트를 인식해요.',
    ],
    imageSrc: '/images/onboarding/onboarding-capture.png',
    imageWidth: 311,
    imageHeight: 196,
  },
  {
    titleLines: ['내가 읽은 만큼', '의견을 볼 수 있어요.'],
    descriptionLines: [
      '스포일러 당할까 걱정되시죠?',
      '팔랑에서는 내가 읽은 부분의 페이지만 보이고,',
      '스포일러 표시된 문장은 보이지 않아요.',
    ],
    imageSrc: '/images/onboarding/onboarding-spoiler.png',
    imageWidth: 269,
    imageHeight: 206,
  },
  {
    titleLines: ['그렇다면 교환독서를', '하러 가볼까요?'],
    descriptionLines: ['밤샘 낭독가님의 기록을 응원할게요'],
    imageSrc: '/images/onboarding/onboarding-start.png',
    imageWidth: 282,
    imageHeight: 211,
  },
]
