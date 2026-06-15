import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_USER_RESERVATIONS } from '../../graphql/queries';
import { CANCEL_RESERVATION } from '../../graphql/mutations';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Reservation {
  id: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  book: {
    id: string;
    title: string;
    coverImage: string | null;
    available: number;
    authors: { name: string }[];
  };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  FULFILLED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 dark:bg-gray-700 text-gray-500',
  EXPIRED:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

const UserReservations: React.FC = () => {
  const { t } = useTranslation();
  const { user }    = useAuth();
  const { addToast } = useToast();

  const { data, loading, refetch } = useQuery(GET_USER_RESERVATIONS, {
    variables:   { userId: user?.id, take: 50 },
    skip:        !user?.id,
    fetchPolicy: 'network-only',
  });

  const [cancelReservation] = useMutation(CANCEL_RESERVATION, {
    onCompleted: () => { addToast(t('reservations.cancelled'), 'success'); refetch(); },
    onError:     (e) => addToast(e.message, 'error'),
  });

  const reservations: Reservation[] = data?.userReservations ?? [];

  if (loading) return <div className="text-center py-8 text-gray-400">{t('reservations.loading')}</div>;

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('reservations.noReservations')}</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t('reservations.hint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map(r => {
        const isPending = r.status === 'PENDING';
        const expires   = new Date(r.expiresAt);
        const isExpiringSoon = isPending && (expires.getTime() - Date.now()) < 6 * 60 * 60 * 1000;

        return (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-4">
            {r.book.coverImage ? (
              <img src={r.book.coverImage} alt={r.book.title}
                className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-14 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0 flex items-center justify-center">
                <span className="text-emerald-600 text-xs font-bold">BOOK</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{r.book.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{r.book.authors.map(a => a.name).join(', ')}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[r.status] ?? ''}`}>
                  {t(`reservations.${r.status}`)}
                </span>
              </div>

              {r.status === 'FULFILLED' && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('reservations.collectBefore', { date: expires.toLocaleDateString() })}
                </p>
              )}
              {isPending && isExpiringSoon && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {t('reservations.expiresLabel', { date: expires.toLocaleString() })}
                </p>
              )}
              {isPending && (
                <button
                  onClick={() => cancelReservation({ variables: { id: r.id } })}
                  className="mt-3 text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  {t('reservations.cancel')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserReservations;
