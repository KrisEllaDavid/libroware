import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_AUDIT_LOGS } from '../../graphql/queries';

const PAGE_SIZE = 30;

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  UPDATE: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400',
  DELETE: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
};

const MODELS = ['', 'User', 'Book', 'Borrow'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE'];

const AuditLogViewer: React.FC = () => {
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
  const pages = Math.ceil(total / PAGE_SIZE);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const resetFilters = () => { setModel(''); setAction(''); setUserId(''); setPage(0); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Every CREATE, UPDATE and DELETE on critical records — {total.toLocaleString()} entries total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Model</label>
          <select value={model} onChange={e => { setModel(e.target.value); setPage(0); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {MODELS.map(m => <option key={m} value={m}>{m || 'All models'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Action</label>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(0); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {ACTIONS.map(a => <option key={a} value={a}>{a || 'All actions'}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Actor User ID</label>
          <input type="text" value={userId} placeholder="Filter by user ID…"
            onChange={e => { setUserId(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        {(model || action || userId) && (
          <button onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-400 text-sm">No audit entries match your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                {['Timestamp', 'Action', 'Model', 'Record ID', 'Actor'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ACTION_STYLE[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.model}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono truncate max-w-[160px]" title={log.recordId}>{log.recordId}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono truncate max-w-[160px]" title={log.userId ?? '—'}>
                    {log.userId ?? <span className="italic text-gray-300">system</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Page {page + 1} of {pages} · {total.toLocaleString()} entries
              </span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  Previous
                </button>
                <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
