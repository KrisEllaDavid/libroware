import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ALL_FINES } from '../../graphql/queries';
import { WAIVE_FINE, MARK_FINE_PAID, SET_FINE_RATE } from '../../graphql/mutations';
import { useToast } from '../../context/ToastContext';

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
  const { addToast } = useToast();
  const [filter, setFilter]       = useState<'all' | 'pending' | 'waived'>('all');
  const [newRate, setNewRate]      = useState('');
  const [showRateForm, setShowRateForm] = useState(false);

  const waived = filter === 'all' ? undefined : filter === 'waived';

  const { data, loading, refetch } = useQuery(GET_ALL_FINES, {
    variables: { take: 50, waived },
    fetchPolicy: 'network-only',
  });

  const [waiveFine]   = useMutation(WAIVE_FINE,     { onCompleted: () => { addToast('Fine waived', 'success'); refetch(); }, onError: (e) => addToast(e.message, 'error') });
  const [markPaid]    = useMutation(MARK_FINE_PAID,  { onCompleted: () => { addToast('Fine marked as paid', 'success'); refetch(); }, onError: (e) => addToast(e.message, 'error') });
  const [setFineRate] = useMutation(SET_FINE_RATE,   { onCompleted: () => { addToast('Fine rate updated', 'success'); setShowRateForm(false); setNewRate(''); }, onError: (e) => addToast(e.message, 'error') });

  const fines: Fine[] = data?.allFines ?? [];
  const totalOutstanding = fines.filter(f => !f.waived && !f.paidAt).reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fines Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Outstanding: <span className="font-semibold text-red-600">{totalOutstanding.toLocaleString()} FCFA</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRateForm(v => !v)}
            className="px-4 py-2 text-sm border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
            Set Daily Rate
          </button>
        </div>
      </div>

      {/* Rate form */}
      {showRateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily fine rate (FCFA)</label>
            <input type="number" min="0" step="50" value={newRate} onChange={e => setNewRate(e.target.value)}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button onClick={() => setFineRate({ variables: { ratePerDay: parseFloat(newRate) } })}
            disabled={!newRate || isNaN(parseFloat(newRate))}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg disabled:opacity-50 transition-all">
            Apply
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['all', 'pending', 'waived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-md capitalize transition-all ${filter === f ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : fines.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No fines found</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                {['Member', 'Book', 'Days Overdue', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {fines.map(fine => {
                const isPaid   = !!fine.paidAt;
                const isWaived = fine.waived;
                return (
                  <tr key={fine.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{fine.borrow.user.firstName} {fine.borrow.user.lastName}</div>
                      <div className="text-xs text-gray-400">{fine.borrow.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fine.borrow.book.title}</td>
                    <td className="px-4 py-3 text-center font-medium text-red-600">{fine.daysOverdue}d</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fine.amount.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      {isWaived ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Waived</span>
                      ) : isPaid ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Paid</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!isWaived && !isPaid && (
                        <div className="flex gap-2">
                          <button onClick={() => waiveFine({ variables: { borrowId: fine.borrowId } })}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                            Waive
                          </button>
                          <button onClick={() => markPaid({ variables: { borrowId: fine.borrowId } })}
                            className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-all">
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinesManagement;
