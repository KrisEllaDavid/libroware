import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_AUDIT_LOGS } from '../../graphql/queries';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
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
  TagTone,
  TR,
} from '../ui';

const PAGE_SIZE = 30;

const ACTION_TONE: Record<string, TagTone> = {
  CREATE: 'brand',
  UPDATE: 'info',
  DELETE: 'danger',
};

const MODELS = ['', 'User', 'Book', 'Borrow', 'Author', 'Category', 'Fine', 'Reservation', 'Review'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE'];

const AuditLogViewer: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage]       = useState(0);
  const [model, setModel]     = useState('');
  const [action, setAction]   = useState('');
  const [userId, setUserId]   = useState('');

  const vars = {
    skip:   page * PAGE_SIZE,
    take:   PAGE_SIZE,
    model:  model  || undefined,
    action: action || undefined,
    userId: userId || undefined,
  };

  const { data, loading } = useQuery(GET_AUDIT_LOGS, {
    variables:   vars,
    fetchPolicy: 'network-only',
  });

  const logs:  any[]  = data?.auditLogs     ?? [];
  const total: number = data?.auditLogCount ?? 0;

  const fmt = fmtDateTime;

  const hasFilters = Boolean(model || action || userId);
  const resetFilters = () => { setModel(''); setAction(''); setUserId(''); setPage(0); };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="shield"
        eyebrow="Administration"
        title={t('auditLog.title')}
        description={t('auditLog.subtitle', { count: total })}
      />

      {/* Filters live in their own card above the table rather than crammed
          into the table header: three controls plus a reset don't fit a header
          row, and they wrapped into the search field on every laptop width. */}
      <Card>
        <CardBody className="py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[12rem_12rem_1fr_auto] lg:items-end">
            <Select
              label={t('auditLog.modelLabel')}
              value={model}
              onChange={(e) => { setModel(e.target.value); setPage(0); }}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m || t('auditLog.allModels')}</option>
              ))}
            </Select>

            <Select
              label={t('auditLog.actionLabel')}
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(0); }}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{a || t('auditLog.allActions')}</option>
              ))}
            </Select>

            <Input
              label={t('auditLog.actorLabel')}
              value={userId}
              placeholder={t('auditLog.actorPlaceholder')}
              onChange={(e) => { setUserId(e.target.value); setPage(0); }}
              icon="user"
              className="font-mono"
            />

            {hasFilters && (
              <Button icon="close" onClick={resetFilters} className="lg:mb-0">
                {t('auditLog.clearFilters')}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t('auditLog.title')}
          description={t('auditLog.subtitle', { count: total })}
        />

        <TableWrap>
          <Table>
            <THead>
              <TR className="hover:bg-transparent dark:hover:bg-transparent">
                <TH>{t('auditLog.colTimestamp')}</TH>
                <TH>{t('auditLog.colAction')}</TH>
                <TH hideBelow="sm">{t('auditLog.colModel')}</TH>
                <TH hideBelow="lg">{t('auditLog.colRecordId')}</TH>
                <TH hideBelow="md">{t('auditLog.colActor')}</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TableMessage colSpan={5}>
                  <TableSkeleton rows={8} cols={4} />
                </TableMessage>
              ) : logs.length === 0 ? (
                <TableMessage colSpan={5}>
                  <EmptyState
                    icon="shield"
                    title={t('auditLog.noEntries')}
                    description={
                      hasFilters
                        ? t('auditLog.noEntriesFiltered', 'No entries match these filters.')
                        : undefined
                    }
                    action={
                      hasFilters ? (
                        <Button variant="secondary" icon="close" onClick={resetFilters}>
                          {t('auditLog.clearFilters')}
                        </Button>
                      ) : undefined
                    }
                  />
                </TableMessage>
              ) : (
                logs.map((log: any) => (
                  <TR key={log.id}>
                    <TD className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      <time dateTime={log.createdAt}>{fmt(log.createdAt)}</time>
                      <StackedMeta showBelow="sm">{log.model}</StackedMeta>
                    </TD>

                    <TD>
                      <Tag tone={ACTION_TONE[log.action] ?? 'neutral'} size="sm">
                        {log.action}
                      </Tag>
                    </TD>

                    <TD hideBelow="sm" className="font-medium text-gray-900 dark:text-white">
                      {log.model}
                    </TD>

                    <TD hideBelow="lg" className="max-w-[10rem]">
                      <span
                        className="block truncate font-mono text-xs text-gray-400 dark:text-gray-500"
                        title={log.recordId}
                      >
                        {log.recordId}
                      </span>
                    </TD>

                    <TD hideBelow="md" className="max-w-[12rem]">
                      {log.user ? (
                        <span className="block truncate" title={log.user.email}>
                          {log.user.firstName} {log.user.lastName}
                        </span>
                      ) : log.userId ? (
                        <span className="italic text-gray-400 dark:text-gray-500" title={log.userId}>
                          {t('auditLog.deletedUser')}
                        </span>
                      ) : (
                        <span className="italic text-gray-400 dark:text-gray-500">
                          {t('auditLog.system')}
                        </span>
                      )}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>

        {/* The bespoke prev/next pair is gone — this is the same pager the rest
            of the admin panel uses, so page controls behave identically
            everywhere. */}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPage={setPage}
        />
      </Card>
    </div>
  );
};

export default AuditLogViewer;
