import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_ALL_FINES, GET_FINE_RATE } from '../../graphql/queries';
import { WAIVE_FINE, MARK_FINE_PAID, SET_FINE_RATE } from '../../graphql/mutations';
import { useToast } from '../../context/ToastContext';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  RowActions,
  Segmented,
  StackedMeta,
  StatCard,
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
  borrowId: string;
  userId: string;
  amount: number;
  dailyRate: number;
  daysOverdue: number;
  waived: boolean;
  waivedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  borrow: {
    id: string;
    dueDate: string;
    returnedAt: string | null;
    user: { id: string; firstName: string; lastName: string; email: string };
    book: { id: string; title: string };
  };
}

const FinesManagement: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [filter, setFilter]       = useState<'all' | 'pending' | 'waived'>('all');
  const [newRate, setNewRate]      = useState('');
  const [showRateForm, setShowRateForm] = useState(false);

  const waived = filter === 'all' ? undefined : filter === 'waived';

  const { data, loading, refetch } = useQuery(GET_ALL_FINES, {
    variables: { take: 50, waived },
    fetchPolicy: 'network-only',
  });

  const { data: rateData, refetch: refetchRate } = useQuery(GET_FINE_RATE, {
    fetchPolicy: 'network-only',
  });
  const currentRate: number | undefined = rateData?.fineRatePerDay;

  const [waiveFine]   = useMutation(WAIVE_FINE,     { onCompleted: () => { addToast(t('fines.waivedToast'), 'success'); refetch(); }, onError: (e) => addToast(e.message, 'error') });
  const [markPaid]    = useMutation(MARK_FINE_PAID,  { onCompleted: () => { addToast(t('fines.paidToast'), 'success'); refetch(); }, onError: (e) => addToast(e.message, 'error') });
  const [setFineRate] = useMutation(SET_FINE_RATE,   { onCompleted: () => { addToast(t('fines.rateUpdated'), 'success'); setShowRateForm(false); setNewRate(''); refetchRate(); }, onError: (e) => addToast(e.message, 'error') });

  // Pre-fill the input with the current rate so the admin sees what they're changing
  const openRateForm = () => {
    setNewRate(currentRate !== undefined ? String(currentRate) : '');
    setShowRateForm(v => !v);
  };

  const fines: Fine[] = data?.allFines ?? [];
  const outstanding = fines.filter(f => !f.waived && !f.paidAt);
  const totalOutstanding = outstanding.reduce((s, f) => s + f.amount, 0);
  const totalCollected = fines.filter(f => f.paidAt).reduce((s, f) => s + f.amount, 0);
  const totalWaived = fines.filter(f => f.waived).reduce((s, f) => s + f.amount, 0);

  const fmt = (n: number) => `${n.toLocaleString()} FCFA`;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="coins"
        eyebrow="Circulation"
        title={t('fines.title')}
        description={t(
          'fines.subtitle',
          'Overdue charges raised against members, and the daily rate they accrue at.'
        )}
        actions={
          <Button
            icon="settings"
            onClick={openRateForm}
            aria-expanded={showRateForm}
          >
            {t('fines.setRate')}
          </Button>
        }
      />

      {/* The three figures a librarian is actually asked about, before the
          row-by-row detail. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="coins"
          tone={totalOutstanding > 0 ? 'danger' : 'brand'}
          label={t('fines.outstanding')}
          value={fmt(totalOutstanding)}
          sub={t('fines.outstandingSub', {
            count: outstanding.length,
            defaultValue: `${outstanding.length} unpaid`,
          })}
        />
        <StatCard
          icon="checkCircle"
          tone="brand"
          label={t('fines.paid')}
          value={fmt(totalCollected)}
        />
        <StatCard
          icon="shield"
          tone="warning"
          label={t('fines.waived')}
          value={fmt(totalWaived)}
          sub={t('fines.currentRateSub', {
            rate: currentRate !== undefined ? currentRate.toLocaleString() : '—',
            defaultValue: `Rate: ${currentRate !== undefined ? currentRate.toLocaleString() : '—'} FCFA per day`,
          })}
        />
      </div>

      {/* Rate editor — inline, not a modal. Changing the rate is a one-field
          edit; a dialog for it would be heavier than the task. */}
      {showRateForm && (
        <Card className="animate-slide-down">
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                type="number"
                min="0"
                step="50"
                inputMode="numeric"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder={t('fines.ratePlaceholder')}
                label={t('fines.rateLabel')}
                hint={
                  currentRate !== undefined
                    ? t('fines.currentlyValue', { value: currentRate.toLocaleString() })
                    : undefined
                }
                wrapperClassName="flex-1"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => setFineRate({ variables: { ratePerDay: parseFloat(newRate) } })}
                  disabled={!newRate || isNaN(parseFloat(newRate))}
                >
                  {t('fines.apply')}
                </Button>
                <Button onClick={() => setShowRateForm(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={t('fines.title')}
          description={t('fines.count', {
            count: fines.length,
            defaultValue: `${fines.length} charges`,
          })}
          actions={
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
              options={[
                { value: 'all', label: t('fines.filter.all') },
                { value: 'pending', label: t('fines.filter.pending') },
                { value: 'waived', label: t('fines.filter.waived') },
              ]}
            />
          }
        />

        <TableWrap>
          <Table>
            <THead>
              <TR className="hover:bg-transparent dark:hover:bg-transparent">
                <TH>{t('fines.member')}</TH>
                <TH hideBelow="md">{t('fines.book')}</TH>
                <TH hideBelow="sm" align="right">{t('fines.daysOverdue')}</TH>
                <TH align="right">{t('fines.amount')}</TH>
                <TH hideBelow="sm">{t('fines.status')}</TH>
                <TH align="right">{t('fines.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TableMessage colSpan={6}>
                  <TableSkeleton rows={6} cols={5} />
                </TableMessage>
              ) : fines.length === 0 ? (
                <TableMessage colSpan={6}>
                  <EmptyState
                    icon="checkCircle"
                    title={t('fines.noFines')}
                    description={t(
                      'fines.noFinesHint',
                      'Nothing is overdue. Charges appear here automatically once a loan passes its due date.'
                    )}
                  />
                </TableMessage>
              ) : (
                fines.map((fine) => {
                  const isPaid = !!fine.paidAt;
                  const isWaived = fine.waived;
                  return (
                    <TR key={fine.id}>
                      <TD className="max-w-[16rem]">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {fine.borrow.user.firstName} {fine.borrow.user.lastName}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {fine.borrow.user.email}
                        </p>
                        <StackedMeta showBelow="md">{fine.borrow.book.title}</StackedMeta>
                        <StackedMeta showBelow="sm">
                          {fine.daysOverdue}
                          {t('fines.daysSuffix')} · {isWaived
                            ? t('fines.waived')
                            : isPaid
                            ? t('fines.paid')
                            : t('fines.pending')}
                        </StackedMeta>
                      </TD>

                      <TD hideBelow="md" className="max-w-[16rem]">
                        <span className="line-clamp-2 break-words">{fine.borrow.book.title}</span>
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
                        <Tag
                          tone={isWaived ? 'neutral' : isPaid ? 'brand' : 'danger'}
                          dot
                        >
                          {isWaived
                            ? t('fines.waived')
                            : isPaid
                            ? t('fines.paid')
                            : t('fines.pending')}
                        </Tag>
                      </TD>

                      <TD align="right">
                        {!isWaived && !isPaid ? (
                          <RowActions className="gap-2">
                            <Button
                              size="sm"
                              onClick={() => waiveFine({ variables: { borrowId: fine.borrowId } })}
                            >
                              {t('fines.waive')}
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              icon="check"
                              onClick={() => markPaid({ variables: { borrowId: fine.borrowId } })}
                            >
                              {t('fines.markPaid')}
                            </Button>
                          </RowActions>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
                            —
                          </span>
                        )}
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

export default FinesManagement;
