import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GET_NOTIFICATIONS, GET_UNREAD_NOTIFICATIONS_COUNT } from '../graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '../graphql/mutations';
import { Notification, NotificationType } from '../types';
import { fmtShort } from '../utils/date';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconName,
  PageHeader,
  Segmented,
  Skeleton,
  cn,
} from './ui';

const TYPE_ICON: Record<NotificationType, IconName> = {
  BORROW_REQUEST: 'books',
  BORROW_APPROVED: 'checkCircle',
  BORROW_REJECTED: 'close',
  OVERDUE_REMINDER: 'clock',
  RESERVATION_READY: 'bookmark',
  FINE_ISSUED: 'coins',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  BORROW_REQUEST:   'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-400',
  BORROW_APPROVED:  'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400',
  BORROW_REJECTED:  'border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400',
  OVERDUE_REMINDER: 'border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400',
  RESERVATION_READY:'border-purple-100 bg-purple-50 text-purple-600 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-400',
  FINE_ISSUED:      'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-400',
};

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtShort(iso);
}

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { take: 50, unreadOnly: filter === 'unread' },
    fetchPolicy: 'cache-and-network',
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    onCompleted: () => refetch(),
  });

  const [markAllRead, { loading: markingAll }] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    refetchQueries: [
      { query: GET_NOTIFICATIONS, variables: { take: 50, unreadOnly: filter === 'unread' } },
      { query: GET_UNREAD_NOTIFICATIONS_COUNT },
    ],
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      markRead({ variables: { id: notif.id } });
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="app-shell page max-w-3xl">
      <PageHeader
        icon="bell"
        title={t('notifications.title')}
        description={
          unreadCount > 0
            ? t('notifications.unreadCount', { count: unreadCount })
            : t('notifications.allCaughtUp', 'You are up to date.')
        }
        actions={
          <>
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
              options={[
                { value: 'all', label: t('notifications.filterAll') },
                { value: 'unread', label: t('notifications.filterUnread') },
              ]}
            />
            {unreadCount > 0 && (
              <Button
                icon="check"
                onClick={() => markAllRead()}
                loading={markingAll}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </>
        }
      />

      {loading && notifications.length === 0 && (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="flex gap-4 p-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card>
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </Card>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Card>
          <EmptyState
            icon="bell"
            title={
              filter === 'unread'
                ? t('notifications.noUnread')
                : t('notifications.noNotifications')
            }
            description={t(
              'notifications.emptyHint',
              'Approvals, reminders and holds ready for collection show up here.'
            )}
            action={
              filter === 'unread' ? (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  {t('notifications.filterAll')}
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {notifications.length > 0 && (
        <ul className="stagger space-y-2.5">
          {notifications.map((notif, i) => {
            const clickable = Boolean(notif.link);
            return (
              <li key={notif.id} style={{ ['--i' as any]: i }}>
                {/*
                  Unread is carried by a brand left edge and a solid title,
                  not by tinting the whole row green — a list where most items
                  are unread became a block of colour with no hierarchy inside
                  it. Rows are real buttons, so keyboard users can open one.
                */}
                <Card
                  as="div"
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={
                    clickable
                      ? (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNotificationClick(notif);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'flex select-none gap-3.5 p-4 transition-all duration-200 ease-soft sm:gap-4',
                    clickable && 'cursor-pointer hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700',
                    !notif.read && 'border-l-4 border-l-emerald-500'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                      TYPE_COLORS[notif.type]
                    )}
                    aria-hidden="true"
                  >
                    <Icon name={TYPE_ICON[notif.type] ?? 'bell'} size={19} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          notif.read
                            ? 'font-medium text-gray-700 dark:text-gray-300'
                            : 'font-semibold text-gray-900 dark:text-white'
                        )}
                      >
                        {notif.title}
                      </p>
                      <time
                        className="shrink-0 text-xs text-gray-400 dark:text-gray-500"
                        dateTime={notif.createdAt ?? undefined}
                      >
                        {timeAgo(notif.createdAt)}
                      </time>
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {notif.message}
                    </p>

                    {!notif.read && (
                      <span className="sr-only">{t('notifications.unread', 'Unread')}</span>
                    )}
                  </div>

                  {clickable && (
                    <Icon
                      name="chevronRight"
                      size={16}
                      className="mt-0.5 shrink-0 self-center text-gray-300 dark:text-gray-600"
                    />
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
