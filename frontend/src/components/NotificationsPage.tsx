import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GET_NOTIFICATIONS, GET_UNREAD_NOTIFICATIONS_COUNT } from '../graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '../graphql/mutations';
import { Notification, NotificationType } from '../types';
import { fmtShort } from '../utils/date';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  BORROW_REQUEST: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  BORROW_APPROVED: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  BORROW_REJECTED: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  OVERDUE_REMINDER: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  RESERVATION_READY: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  FINE_ISSUED: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const TYPE_COLORS: Record<NotificationType, string> = {
  BORROW_REQUEST:   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  BORROW_APPROVED:  'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  BORROW_REJECTED:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  OVERDUE_REMINDER: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  RESERVATION_READY:'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  FINE_ISSUED:      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('notifications.title')}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('notifications.unreadCount', { count: unreadCount })}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={markingAll}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 disabled:opacity-50"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            filter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t('notifications.filterAll')}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            filter === 'unread'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t('notifications.filterUnread')}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent" />
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 dark:text-red-400">
          {t('common.error')}: {error.message}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'unread' ? t('notifications.noUnread') : t('notifications.noNotifications')}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            className={`relative flex gap-4 p-4 rounded-xl border transition-colors cursor-pointer select-none ${
              notif.read
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
            }`}
          >
            {/* Unread dot */}
            {!notif.read && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${TYPE_COLORS[notif.type]}`}>
              {TYPE_ICONS[notif.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <p className={`text-sm font-semibold ${notif.read ? 'text-gray-800 dark:text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                {notif.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                {notif.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {timeAgo(notif.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
