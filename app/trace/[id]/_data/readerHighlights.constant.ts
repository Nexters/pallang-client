import type { Highlight, Trace } from '../_types/readerHighlights.type'

export const bookTitle = '모순'

export const firstHighlight: Highlight = {
  page: 7,
  quotes: [
    '“거기 뒷좌석 보세요. 약간의 간식과 음료수를 준비했습니다. 드세요. 오늘 아침, 나 정말 바빴어요. 진진씨 모시려고 세차도 했지요. 진진씨한테 잘 보이려고 목욕탕에도 갔다왔지요. 여기 봐요. 기름도 만땅이잖아요?”',
    '나는 그때 왜 몰랐을까. 삶이란 언제나 정면이 아니라 비스듬히 다가온다는 것을.',
    '행복이 무엇인지 자꾸 생각하면 할수록 행복은 저만치 달아나 버렸다.',
    '누군가를 이해한다는 것은 그 사람의 시간을 함께 걸어보는 일이었다.',
  ],
  isSpoiler: false,
}

export const highlightSeed: Highlight[] = [
  firstHighlight,
  {
    page: 9,
    quotes: ['지금 내 인생에 필요한 것은 무엇이든 사랑하는 일이라고, 나는 그렇게 결론지었다.'],
    isSpoiler: true,
  },
  {
    page: 12,
    quotes: ['사람들은 저마다 스스로의 생을 채색할 물감을 고르며 살아간다.'],
    isSpoiler: false,
  },
  {
    page: 23,
    quotes: ['이모의 삶과 어머니의 삶, 그 두 개의 삶이 내 앞에 나란히 놓여 있었다.'],
    isSpoiler: false,
  },
  {
    page: 34,
    quotes: ['불행 앞에서 우리는 얼마나 자주 웃음으로 자신을 방어하는가.'],
    isSpoiler: false,
  },
  {
    page: 123,
    quotes: ['인생의 부피를 늘려주는 것은 즐거움이 아니라 고통이라는 것을 그때 알았다.'],
    isSpoiler: true,
  },
  {
    page: 169,
    quotes: ['결국 우리는 각자의 모순을 끌어안은 채 살아가는 수밖에 없는 것이다.'],
    isSpoiler: false,
  },
]

// ponytail: 고정 목 타임스탬프 — 시간이 지나면 상대 표기가 날짜 표기로 자연히 바뀐다
export const traceSeed: Trace[] = [
  {
    id: 1,
    nickname: '책책책을읽자',
    content:
      '책장 냄새가 이렇게 묘사될 수 있구나 싶었어요. 헌책방에 갈 때마다 이 냄새를 맡으면 마음이 차분해지거든요. 오래된 종이 냄새, 손때 묻은 표지, 누군가 밑줄 그어놓은 흔적까지 전부요. 그 공간에 서 있으면 시간이 천천히 흐르는 기분이 들어요.',
    createdAt: '2026-07-23T02:00:00.000Z',
    likeCount: 4,
    commentCount: 1,
  },
  {
    id: 2,
    nickname: '밤의독서가',
    content: '이 문장에서 한참을 머물렀어요. 안진진의 마음이 그대로 전해지는 것 같아요.',
    createdAt: '2026-07-21T09:00:00.000Z',
    likeCount: 120,
    commentCount: 3,
  },
  {
    id: 3,
    nickname: '모순덩어리',
    content: '결혼이란 결국 선택의 문제라는 말, 읽을 때마다 다르게 다가와요.',
    createdAt: '2026-07-20T09:00:00.000Z',
    likeCount: 8,
    commentCount: 2,
  },
  {
    id: 4,
    nickname: '고요한오후',
    content: '저도 이 장면에서 울컥했습니다. 삶은 정말 아이러니의 연속이네요.',
    createdAt: '2026-07-09T09:00:00.000Z',
    likeCount: 21,
    commentCount: 5,
  },
  {
    id: 5,
    nickname: '종이위의산책',
    content: '양귀자 작가의 문장은 담백한데도 오래 남아요. 필사하고 싶은 구절.',
    createdAt: '2026-07-02T09:00:00.000Z',
    likeCount: 15,
    commentCount: 0,
  },
]
