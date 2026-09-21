import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_USER_FINES } from '../../graphql/queries';
import { fmtShort } from '../../utils/date';
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  StackedMeta,
  Table,
  TableMessage,
  TableSkeleton,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  Tag,
  TR,
} from '../ui';

interface Fine {
  id: string;
  amount: number;
  dailyRate: number;
  daysOverdue: number;
  waived: boolean;
  paidAt: string | null;
  createdAt: string;
  borrow: {
    id: string;
    dueDate: string;
    returnedAt: string | null;
    book: { id: string; title: string };
  };
}

interface UserFinesProps {
  userId: string;
}

const UserFines: React.FC<UserFinesProps> = ({ userId }) => {
  const { t } = useTranslation();

  const { data, loading, error, refetch } = useQuery(GET_USER_FINES, {
    variables: { userId, take: 100 },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  const fines: Fine[] = data?.userFines ?? [];
  const outstanding = fines.filter(f => !f.waived && !f.paidAt).reduce((s, f) => s + f.amount, 0);
  const hasUnpaid = fines.some(f => !f.waived && !f.paidAt);

  const fmtDate = fmtShort;

  if (error) {
    return (
      <Card>
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/*
        The balance leads, as its own statement. Whether a member owes anything
        is the one question this screen exists to answer, and it was previously
        a caption beside the heading.
      */}
      <Card
        className={
          outstanding > 0
            ? 'border-l-4 border-l-red-500 p-5 sm:p-6'
            : 'border-l-4 border-l-emerald-500 p-5 sm:p-6'
        }
      >
        <p className="text-[0.8125rem] font-medium text-gray-500 dark:text-gray-400">
          {t('userFines.outstanding')}
        </p>
        <p
          data-numeric
          className={`mt-1.5 font-display text-3xl font-semibold tracking-tight ${
            outstanding > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {outstanding.toLocaleString()}
          <span className="ml-1.5 text-base font-medium text-gray-400">FCFA</span>
        </p>
        {hasUnpaid && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {t('userFines.payInPersonNote')}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader
          title={t('userFines.title')}
          description={t('userFines.count', {
            count: fines.length,
            defaultValue: `${fines.length} charges`,
          })}
        />

        <TableWrap>
          <Table>
            <THead>
              <TR className="hover:bg-transparent dark:hover:bg-transparent">
                <TH>{t('userFines.colBook')}</TH>
                <TH hideBelow="sm" align="right">{t('userFines.colDaysOverdue')}</TH>
                <TH align="right">{t('userFines.colAmount')}</TH>
                <TH hideBelow="sm">{t('userFines.colStatus')}</TH>
                <TH hideBelow="md">{t('userFines.colDate')}</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TableMessage colSpan={5}>
                  <TableSkeleton rows={4} cols={4} />
                </TableMessage>
              ) : fines.length === 0 ? (
                <TableMessage colSpan={5}>
                  <EmptyState
                    icon="checkCircle"
                    title={t('userFines.noFines')}
                    description={t(
                      'userFines.noFinesHint',
                      'Nothing owed. Return books by their due date and it stays that way.'
                    )}
                  />
                </TableMessage>
              ) : (
                fines.map((fine) => {
                  const isPaid = !!fine.paidAt;
                  const isWaived = fine.waived;
                  const label = isWaived
                    ? t('fines.waived')
                    : isPaid
                    ? t('fines.paid')
                    : t('fines.pending');
                  return (
                    <TR key={fine.id}>
                      <TD className="max-w-[18rem]">
                        <p className="break-words font-medium text-gray-900 dark:text-white">
                          {fine.borrow.book.title}
                        </p>
                        <StackedMeta showBelow="sm">
                          {fine.daysOverdue}
                          {t('fines.daysSuffix')} · {label}
                        </StackedMeta>
                      </TD>

                      <TD hideBelow="sm" align="right">
                        <span data-numeric className="font-medium text-red-600 dark:text-red-400">
                          {fine.daysOverdue}
                          {t('fines.daysSuffix')}
                        </span>
                      </TD>

                      <TD align="right">
                        <span
                          data-numeric
                          className="whitespace-nowrap font-semibold text-gray-900 dark:text-white"
                        >
                          {fine.amount.toLocaleString()}
                          <span className="ml-1 text-xs font-normal text-gray-400">FCFA</span>
                        </span>
                      </TD>

                      <TD hideBelow="sm">
                        <Tag tone={isWaived ? 'neutral' : isPaid ? 'brand' : 'danger'} dot>
                          {label}
                        </Tag>
                      </TD>

                      <TD hideBelow="md" className="whitespace-nowrap text-xs">
                        {fmtDate(fine.createdAt)}
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
};

export default UserFines;
