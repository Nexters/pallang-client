import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { commentQueries, type RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { CommentItem } from '../CommentItem/CommentItem'

type CommentThreadProps = {
  comment: RootCommentResponse
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

/**
 * 원댓글 한 개와 그 아래 답글 묶음.
 * 답글은 접힌 채로 시작한다 — 디자인(2224:18752 / 2165:5144)의 댓글 묶음에는 원댓글 카드만 있고,
 * 미리보기까지 펼쳐두면 "댓글 5개"가 카드 13개로 불어나 목록이 화면 세 배 길이가 된다.
 */
export function CommentThread({ comment, myUserId, onUpdate, onRemove }: CommentThreadProps) {
  // 0: 접힘, 1: 원댓글 응답이 준 미리보기(최대 5개)까지, 2+: 미리보기 + 더보기로 받은 페이지
  const [revealStep, setRevealStep] = useState(0)
  const repliesQuery = useInfiniteQuery({
    ...commentQueries.replies(comment.commentId),
    enabled: revealStep >= 2,
  })
  const fetchedReplies = useMemo(
    () => repliesQuery.data?.pages.flatMap((page) => page.data?.comments ?? []) ?? [],
    [repliesQuery.data],
  )
  // 단계마다 무엇을 보여줄지 딱 잘라 나눈다. 접었다 펴면 revealStep은 0으로 돌아가지만 답글 캐시는
  // 남아 있어, step 1에서 미리보기와 캐시를 합치면 5개가 아니라 10개가 한 번에 나타난다.
  const replies =
    revealStep === 0
      ? []
      : revealStep === 1
        ? comment.replies
        : [...comment.replies, ...fetchedReplies]

  // 첫 페이지가 실패했을 때만 재시도로 취급한다 — 접힌 상태에서 남아 있는 캐시의 에러까지 끌어오지 않는다
  const hasRepliesError = revealStep >= 2 && repliesQuery.isError
  const canLoadMoreReplies =
    revealStep === 0
      ? comment.replyCount > 0
      : revealStep === 1
        ? // hasMoreReplies 대신 개수로 따진다 — 미리보기로 받은 만큼을 빼야 서버 미리보기 개수가 바뀌어도 어긋나지 않는다
          comment.replyCount > comment.replies.length
        : // 아직 못 받았거나(로딩) 실패한 동안에도 버튼을 남긴다 — 사라지면 다시 시도할 길이 없다
          repliesQuery.hasNextPage || repliesQuery.isPending || hasRepliesError

  return (
    <div className="flex flex-col gap-0.5">
      <CommentItem
        comment={comment}
        isMine={comment.userId === myUserId}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
      {replies.map((reply) => (
        <CommentItem
          key={reply.commentId}
          comment={reply}
          isMine={reply.userId === myUserId}
          isReply
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
      {canLoadMoreReplies && (
        <button
          type="button"
          disabled={repliesQuery.isFetching}
          onClick={() => {
            if (revealStep < 2) {
              setRevealStep(revealStep + 1)
              return
            }
            // 첫 페이지가 실패하면 되돌아갈 페이지가 없어 fetchNextPage로는 다시 받을 수 없다
            if (hasRepliesError) {
              void repliesQuery.refetch()
              return
            }
            void repliesQuery.fetchNextPage()
          }}
          className="bg-bg-overlay py-3 pl-8 text-left text-body-14rg text-text-inverse/50"
        >
          {hasRepliesError ? '답글 다시 불러오기' : '답글 더보기'}
        </button>
      )}
    </div>
  )
}
