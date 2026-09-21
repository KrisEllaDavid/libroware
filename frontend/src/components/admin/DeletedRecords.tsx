import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_DELETED_USERS, GET_DELETED_BOOKS } from '../../graphql/queries';
import { RESTORE_USER, HARD_DELETE_USER, RESTORE_BOOK, HARD_DELETE_BOOK } from '../../graphql/mutations';
import { useToast } from '../../context/ToastContext';
import { fmtShort } from '../../utils/date';
import Modal from '../Modal';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  RowActions,
  Segmented,
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

type Section = 'users' | 'books';

const ROLE_TONE: Record<string, TagTone> = {
  ADMIN: 'danger',
  LIBRARIAN: 'warning',
  USER: 'neutral',
};

const DeletedRecords: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [section, setSection] = useState<Section>('users');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ── Users ─────────────────────────────────────────────────────────────────
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } =
    useQuery(GET_DELETED_USERS, { variables: { take: 50 }, fetchPolicy: 'network-only' });

  const [restoreUser]   = useMutation(RESTORE_USER,    { onCompleted: () => { addToast(t('deletedRecords.userRestored'), 'success'); refetchUsers(); }, onError: e => addToast(e.message, 'error') });
  const [hardDeleteUser] = useMutation(HARD_DELETE_USER, { onCompleted: () => { addToast(t('deletedRecords.userDeleted'), 'success'); setConfirmId(null); refetchUsers(); }, onError: e => addToast(e.message, 'error') });

  // ── Books ─────────────────────────────────────────────────────────────────
  const { data: booksData, loading: booksLoading, refetch: refetchBooks } =
    useQuery(GET_DELETED_BOOKS, { variables: { take: 50 }, fetchPolicy: 'network-only' });

  const [restoreBook]   = useMutation(RESTORE_BOOK,    { onCompleted: () => { addToast(t('deletedRecords.bookRestored'), 'success'); refetchBooks(); }, onError: e => addToast(e.message, 'error') });
  const [hardDeleteBook] = useMutation(HARD_DELETE_BOOK, { onCompleted: () => { addToast(t('deletedRecords.bookDeleted'), 'success'); setConfirmId(null); refetchBooks(); }, onError: e => addToast(e.message, 'error') });

  const deletedUsers = usersData?.deletedUsers ?? [];
  const deletedBooks = booksData?.deletedBooks ?? [];
  const loading      = section === 'users' ? usersLoading : booksLoading;
  const isEmpty      = section === 'users' ? deletedUsers.length === 0 : deletedBooks.length === 0;

  const fmtDate = fmtShort;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="trash"
        eyebrow="Administration"
        title={t('admin.tabs.deleted', 'Recycle bin')}
        description={t('deletedRecords.subtitle')}
      />

      <Card>
        <CardHeader
          title={
            section === 'users'
              ? t('deletedRecords.sectionUsers')
              : t('deletedRecords.sectionBooks')
          }
          description={
            section === 'users'
              ? `${deletedUsers.length} removed`
              : `${deletedBooks.length} removed`
          }
          actions={
            <Segmented
              value={section}
              onChange={(v) => setSection(v as Section)}
              options={[
                {
                  value: 'users',
                  label: `${t('deletedRecords.sectionUsers')} (${deletedUsers.length})`,
                },
                {
                  value: 'books',
                  label: `${t('deletedRecords.sectionBooks')} (${deletedBooks.length})`,
                },
              ]}
            />
          }
        />

        <TableWrap>
          <Table>
            <THead>
              <TR className="hover:bg-transparent dark:hover:bg-transparent">
                <TH>
                  {section === 'users'
                    ? t('deletedRecords.colUser')
                    : t('deletedRecords.colBook')}
                </TH>
                <TH hideBelow="md">
                  {section === 'users'
                    ? t('deletedRecords.colRole')
                    : t('books.authors', 'Authors')}
                </TH>
                <TH hideBelow="sm">{t('deletedRecords.colDeletedOn')}</TH>
                <TH align="right">{t('users.actions', 'Actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TableMessage colSpan={4}>
                  <TableSkeleton rows={5} cols={3} />
                </TableMessage>
              ) : isEmpty ? (
                <TableMessage colSpan={4}>
                  <EmptyState
                    icon="restore"
                    title={
                      section === 'users'
                        ? t('deletedRecords.noneFoundUsers')
                        : t('deletedRecords.noneFoundBooks')
                    }
                    description={t('deletedRecords.appearHere')}
                  />
                </TableMessage>
              ) : section === 'users' ? (
                deletedUsers.map((u: any) => (
                  <TR key={u.id}>
                    <TD className="max-w-[18rem]">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {u.email}
                      </p>
                      <StackedMeta showBelow="sm">
                        {t('deletedRecords.colDeletedOn')}: {fmtDate(u.deletedAt)}
                      </StackedMeta>
                    </TD>
                    <TD hideBelow="md">
                      <Tag tone={ROLE_TONE[u.role] ?? 'neutral'} size="sm">
                        {u.role}
                      </Tag>
                    </TD>
                    <TD hideBelow="sm" className="whitespace-nowrap text-xs">
                      {fmtDate(u.deletedAt)}
                    </TD>
                    <TD align="right">
                      <RowActions className="gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          icon="restore"
                          onClick={() => restoreUser({ variables: { id: u.id } })}
                        >
                          {t('deletedRecords.restore')}
                        </Button>
                        <Button
                          size="sm"
                          icon="trash"
                          onClick={() => setConfirmId(u.id)}
                          className="text-red-600 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          {t('deletedRecords.deletePermanently')}
                        </Button>
                      </RowActions>
                    </TD>
                  </TR>
                ))
              ) : (
                deletedBooks.map((b: any) => (
                  <TR key={b.id}>
                    <TD className="max-w-[18rem]">
                      <p className="break-words font-medium text-gray-900 dark:text-white">
                        {b.title}
                      </p>
                      <p className="truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                        {t('browseBooks.isbnLabel')} {b.isbn}
                      </p>
                      <StackedMeta showBelow="md">
                        {b.authors.map((a: any) => a.name).join(', ') || '—'}
                      </StackedMeta>
                      <StackedMeta showBelow="sm">
                        {t('deletedRecords.colDeletedOn')}: {fmtDate(b.deletedAt)}
                      </StackedMeta>
                    </TD>
                    <TD hideBelow="md" className="max-w-[14rem] text-xs">
                      <span className="line-clamp-2">
                        {b.authors.map((a: any) => a.name).join(', ') || '—'}
                      </span>
                    </TD>
                    <TD hideBelow="sm" className="whitespace-nowrap text-xs">
                      {fmtDate(b.deletedAt)}
                    </TD>
                    <TD align="right">
                      <RowActions className="gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          icon="restore"
                          onClick={() => restoreBook({ variables: { id: b.id } })}
                        >
                          {t('deletedRecords.restore')}
                        </Button>
                        <Button
                          size="sm"
                          icon="trash"
                          onClick={() => setConfirmId(b.id)}
                          className="text-red-600 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          {t('deletedRecords.deletePermanently')}
                        </Button>
                      </RowActions>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      {/*
        Permanent deletion now goes through the app's own Modal rather than a
        bespoke overlay. That gets it the escape handler, focus trap, scroll
        lock and mobile sheet treatment every other dialog already has — all of
        which the hand-rolled version was missing, on the single most
        destructive action in the product.
      */}
      <Modal
        isOpen={!!confirmId}
        type="delete"
        size="sm"
        title={t('deletedRecords.confirmTitle')}
        confirmText={t('deletedRecords.deletePermanently')}
        cancelText={t('common.cancel')}
        showToast={false}
        onCancel={() => setConfirmId(null)}
        onConfirm={() =>
          section === 'users'
            ? hardDeleteUser({ variables: { id: confirmId } })
            : hardDeleteBook({ variables: { id: confirmId } })
        }
      >
        <Alert tone="danger">
          {t('deletedRecords.confirmBodyPrefix')}
          <strong>{t('deletedRecords.confirmBodyBold')}</strong>
          {t('deletedRecords.confirmBodySuffix')}
        </Alert>
      </Modal>
    </div>
  );
};

export default DeletedRecords;
