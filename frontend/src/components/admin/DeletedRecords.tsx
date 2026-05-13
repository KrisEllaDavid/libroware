import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DELETED_USERS, GET_DELETED_BOOKS } from '../../graphql/queries';
import { RESTORE_USER, HARD_DELETE_USER, RESTORE_BOOK, HARD_DELETE_BOOK } from '../../graphql/mutations';
import { useToast } from '../../context/ToastContext';

type Section = 'users' | 'books';

const ROLE_BADGE: Record<string, string> = {
  ADMIN:     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  LIBRARIAN: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  USER:      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

const DeletedRecords: React.FC = () => {
  const { addToast } = useToast();
  const [section, setSection] = useState<Section>('users');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ── Users ─────────────────────────────────────────────────────────────────
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } =
    useQuery(GET_DELETED_USERS, { variables: { take: 50 }, fetchPolicy: 'network-only' });

  const [restoreUser]   = useMutation(RESTORE_USER,    { onCompleted: () => { addToast('User restored', 'success'); refetchUsers(); }, onError: e => addToast(e.message, 'error') });
  const [hardDeleteUser] = useMutation(HARD_DELETE_USER, { onCompleted: () => { addToast('User permanently deleted', 'success'); setConfirmId(null); refetchUsers(); }, onError: e => addToast(e.message, 'error') });

  // ── Books ─────────────────────────────────────────────────────────────────
  const { data: booksData, loading: booksLoading, refetch: refetchBooks } =
    useQuery(GET_DELETED_BOOKS, { variables: { take: 50 }, fetchPolicy: 'network-only' });

  const [restoreBook]   = useMutation(RESTORE_BOOK,    { onCompleted: () => { addToast('Book restored', 'success'); refetchBooks(); }, onError: e => addToast(e.message, 'error') });
  const [hardDeleteBook] = useMutation(HARD_DELETE_BOOK, { onCompleted: () => { addToast('Book permanently deleted', 'success'); setConfirmId(null); refetchBooks(); }, onError: e => addToast(e.message, 'error') });

  const deletedUsers = usersData?.deletedUsers ?? [];
  const deletedBooks = booksData?.deletedBooks ?? [];
  const loading      = section === 'users' ? usersLoading : booksLoading;
  const isEmpty      = section === 'users' ? deletedUsers.length === 0 : deletedBooks.length === 0;

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recycle Bin</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Restore or permanently delete soft-deleted records. Permanent deletion cannot be undone.
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['users', 'books'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-5 py-1.5 text-sm rounded-md capitalize transition-all ${
              section === s
                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
            {s} {s === 'users' ? `(${deletedUsers.length})` : `(${deletedBooks.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : isEmpty ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-400 text-sm">No deleted {section} found</p>
          <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Records you delete will appear here</p>
        </div>
      ) : section === 'users' ? (
        // ── Deleted users table ─────────────────────────────────────────────
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                {['User', 'Role', 'Deleted on', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {deletedUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_BADGE[u.role] ?? ''}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{fmtDate(u.deletedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => restoreUser({ variables: { id: u.id } })}
                        className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all">
                        Restore
                      </button>
                      <button onClick={() => setConfirmId(u.id)}
                        className="px-3 py-1 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        Delete permanently
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // ── Deleted books table ─────────────────────────────────────────────
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                {['Book', 'Authors', 'Deleted on', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {deletedBooks.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{b.title}</p>
                    <p className="text-xs text-gray-400 font-mono">ISBN: {b.isbn}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {b.authors.map((a: any) => a.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{fmtDate(b.deletedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => restoreBook({ variables: { id: b.id } })}
                        className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all">
                        Restore
                      </button>
                      <button onClick={() => setConfirmId(b.id)}
                        className="px-3 py-1 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        Delete permanently
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Permanent delete confirmation overlay */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-80">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Permanent deletion</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will permanently remove the record and all associated data. This action <strong>cannot be undone</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                Cancel
              </button>
              <button onClick={() =>
                section === 'users'
                  ? hardDeleteUser({ variables: { id: confirmId } })
                  : hardDeleteBook({ variables: { id: confirmId } })
              }
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all">
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedRecords;
