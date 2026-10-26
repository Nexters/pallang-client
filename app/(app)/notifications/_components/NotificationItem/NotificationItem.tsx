import BellIcon from '@/app/_global/_components/Icon/assets/bell.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import type { NotificationResponse } from '@/app/_global/_queries/notification.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { formatNotificationTime } from '../../_services/notificationTime.service'

const TYPE_META: Record<NotificationResponse['type'], { label: string; Icon: typeof BellIcon }> = {
  OPINION_COMMENTED: { label: '댓글', Icon: PencilIcon },
  OPINION_LIKED: { label: '좋아요', Icon: LikeIcon },
  // 시안이 아직 없다 — 나오기 전까지 벨 아이콘으로 둔다
  BOOK_NEW_OPINIONS: { label: '새 의견', Icon: BellIcon },
  GROUP_JOINED: { label: '모임 가입', Icon: BellIcon },
  GROUP_MEMBER_JOINED: { label: '모임원 가입', Icon: BellIcon },
  GROUP_SCHEDULE_CHANGED: { label: '모임 일정 변경', Icon: BellIcon },
  GROUP_ENDING_SOON: { label: '모임 종료 임박', Icon: BellIcon },
  CONTENT_REMOVED: { label: '운영 안내', Icon: BellIcon },
}

type NotificationItemProps = {
  notification: NotificationResponse
  onOpen: () => void
}

/** 시안(3912:19810 / 읽음 3912:19811) — 읽은 알림은 글자를 반투명으로 낮추고 새 알림 점을 뗀다 */
export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const { label, Icon } = TYPE_META[notification.type]
  const { isRead } = notification

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="press flex w-full items-start gap-3 bg-bg-default px-4 py-5 text-left"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-bg-surface">
          <Icon
            aria-hidden="true"
            className={cn('size-4', isRead ? 'text-icon-muted' : 'text-icon-primary')}
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span
            className={cn(
              'flex items-center justify-between gap-2 text-caption-12rg',
              isRead && 'text-text-placeholder-a50',
            )}
          >
            <span className={cn('font-semibold', !isRead && 'text-text-primary')}>{label}</span>
            <time
              dateTime={notification.createdAt}
              className={cn('shrink-0', !isRead && 'text-text-tertiary')}
            >
              {formatNotificationTime(notification.createdAt)}
            </time>
          </span>
          <span className="flex flex-col gap-1">
            <span className="flex items-start gap-0.5">
              <strong
                className={cn(
                  'min-w-0 text-body-16bd',
                  isRead ? 'text-text-placeholder-a50' : 'text-text-primary',
                )}
              >
                {notification.title}
              </strong>
              {!isRead && (
                <span className="flex shrink-0 py-1">
                  <span aria-hidden="true" className="size-1 rounded-full bg-icon-accent" />
                  <span className="sr-only">읽지 않음</span>
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-body-14rg',
                isRead ? 'text-text-placeholder-a50' : 'text-text-secondary',
              )}
            >
              {notification.body}
            </span>
          </span>
        </span>
      </button>
    </li>
  )
}
