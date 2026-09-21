import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_USER_RESERVATIONS } from '../../graphql/queries';
import { CANCEL_RESERVATION } from '../../graphql/mutations';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fmtShort } from '../../utils/date';
import {
  Alert,
  BookCover,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Tag,
  TagTone,
} from '../ui';

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

const STATUS_TONE: Record<string, TagTone> = {
  PENDING: 'warning',
  FULFILLED: 'brand',
  CANCELLED: 'neutral',
  EXPIRED: 'danger',
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

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex gap-4 p-4">
            <Skeleton className="h-20 w-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="bookmark"
          title={t('reservations.noReservations')}
          description={t('reservations.hint')}
        />
      </Card>
    );
  }

  return (
    <ul className="stagger space-y-3">
      {reservations.map((r, i) => {
        const isPending = r.status === 'PENDING';
        const expiresMs = r.expiresAt ? new Date(r.expiresAt).getTime() : 0;
        const isExpiringSoon = isPending && expiresMs > 0 && (expiresMs - Date.now()) < 6 * 60 * 60 * 1000;

        return (
          <li key={r.id} style={{ ['--i' as any]: i }}>
            <Card
              className={
                /* A fulfilled hold is the only one that needs acting on — it
                   gets a brand left edge so it separates from the queue. */
                r.status === 'FULFILLED'
                  ? 'flex gap-4 border-l-4 border-l-emerald-500 p-4'
                  : 'flex gap-4 p-4'
              }
            >
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg shadow-xs">
                <BookCover
                  title={r.book.title}
                  src={r.book.coverImage}
                  size="sm"
                  rounded="rounded-lg"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                      {r.book.title}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {r.book.authors.map(a => a.name).join(', ')}
                    </p>
                  </div>
                  <Tag tone={STATUS_TONE[r.status] ?? 'neutral'} dot className="shrink-0">
                    {t(`reservations.${r.status}`)}
                  </Tag>
                </div>

                {r.status === 'FULFILLED' && (
                  <Alert tone="success" className="mt-2.5 py-2">
                    {t('reservations.collectBefore', { date: fmtShort(r.expiresAt) })}
                  </Alert>
                )}

                {isPending && isExpiringSoon && (
                  <Alert tone="warning" className="mt-2.5 py-2">
                    {t('reservations.expiresLabel', { date: fmtShort(r.expiresAt) })}
                  </Alert>
                )}

                {isPending && (
                  <Button
                    size="sm"
                    icon="close"
                    className="mt-3"
                    onClick={() => cancelReservation({ variables: { id: r.id } })}
                  >
                    {t('reservations.cancel')}
                  </Button>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
};

export default UserReservations;
