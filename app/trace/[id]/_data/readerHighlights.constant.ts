import type { Trace } from '../_types/readerHighlights.type'

export const bookTitle = '모순'

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
    isSpoiler: false,
    comments: [
      {
        id: 1,
        nickname: '지우',
        content: '책장 냄새가 이렇게 묘사될 수 있구나 싶었어요.',
        createdAt: '2026-07-23T05:00:00.000Z',
      },
      {
        id: 2,
        nickname: '책장',
        content: '헌책방에 갈 때마다 이 냄새를 맡으면 마음이 차분해지거든요.',
        createdAt: '2026-07-23T08:00:00.000Z',
      },
    ],
  },
  {
    id: 2,
    nickname: '밤의독서가',
    content: '이 문장에서 한참을 머물렀어요. 안진진의 마음이 그대로 전해지는 것 같아요.',
    createdAt: '2026-07-21T09:00:00.000Z',
    likeCount: 120,
    commentCount: 3,
    isSpoiler: false,
    comments: [],
  },
  {
    id: 3,
    nickname: '모순덩어리',
    content: '결혼이란 결국 선택의 문제라는 말, 읽을 때마다 다르게 다가와요.',
    createdAt: '2026-07-20T09:00:00.000Z',
    likeCount: 8,
    commentCount: 2,
    isSpoiler: true,
    comments: [],
  },
  {
    id: 4,
    nickname: '고요한오후',
    content: '저도 이 장면에서 울컥했습니다. 삶은 정말 아이러니의 연속이네요.',
    createdAt: '2026-07-09T09:00:00.000Z',
    likeCount: 21,
    commentCount: 5,
    isSpoiler: false,
    comments: [],
  },
  {
    id: 5,
    nickname: '종이위의산책',
    content: '양귀자 작가의 문장은 담백한데도 오래 남아요. 필사하고 싶은 구절.',
    createdAt: '2026-07-02T09:00:00.000Z',
    likeCount: 15,
    commentCount: 0,
    isSpoiler: false,
    comments: [],
  },
]
