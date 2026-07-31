import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { Spinner } from '@/app/_global/_components/Spinner/Spinner'
import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { useCommentActions } from '../../_hooks/useCommentActions'
import { CommentThread } from '../CommentThread/CommentThread'

type TraceCommentSectionProps = {
  opinionId: number
}

/**
 * 흔적 아이템 바로 아래에 인라인으로 펼쳐지는 댓글 묶음.
 * 댓글은 5개까지 보이고 더보기를 누를 때마다 5개씩 이어 붙는다(디자인 2165:5125 주석).
 */
export function TraceCommentSection({ opinionId }: TraceCommentSectionProps) {
  const commentsQuery = useInfiniteQuery(commentQueries.listByOpinion(opinionId))
  // 비로그인이면 me 조회가 실패해 myUserId가 없고, 수정·삭제 버튼이 숨겨진다
  const { data: meData } = useQuery(userQueries.me())
  const actions = useCommentActions(opinionId)

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data?.comments ?? []) ?? [],
    [commentsQuery.data],
  )
  const myUserId = meData?.data?.userId

  if (commentsQuery.isPending) {
    return (
      <section
        aria-label="댓글 목록"
        aria-busy="true"
        className="flex justify-center bg-bg-overlay p-4"
      >
        <Spinner className="text-text-inverse/50" />
      </section>
    )
  }

  // 실패를 그냥 두면 빈 상자만 남아 "댓글 없음"과 구분되지 않는다
  if (commentsQuery.isError) {
    return (
      <section
        aria-label="댓글 목록"
        className="flex flex-col items-center gap-2 bg-bg-overlay p-4 text-body-14rg text-text-inverse/50"
      >
        <p>댓글을 불러오지 못했어요.</p>
        <button
          type="button"
          onClick={() => {
            void commentsQuery.refetch()
          }}
          className="text-body-14sb text-text-inverse underline"
        >
          댓글 다시 불러오기
        </button>
      </section>
    )
  }

  return (
    <section aria-label="댓글 목록" className="flex flex-col gap-0.5 pb-4">
      {comments.map((comment) => (
        <CommentThread
          key={comment.commentId}
          comment={comment}
          myUserId={myUserId}
          onUpdate={(commentId, content) => {
            actions.update.mutate({ commentId, content })
          }}
          onRemove={(commentId) => {
            actions.remove.mutate(commentId)
          }}
        />
      ))}
      {commentsQuery.hasNextPage && (
        <button
          type="button"
          disabled={commentsQuery.isFetchingNextPage}
          onClick={() => {
            void commentsQuery.fetchNextPage()
          }}
          className="flex w-full items-center justify-center gap-2 bg-bg-black p-4 text-body-16md text-text-inverse"
        >
          댓글 더보기
          <PlusIcon width={20} height={20} className="text-icon-active" />
        </button>
      )}
    </section>
  )
}
