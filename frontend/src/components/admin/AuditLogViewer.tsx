import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_AUDIT_LOGS } from '../../graphql/queries';
import { fmtDateTime } from '../../utils/date';

const PAGE_SIZE = 30;

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  UPDATE: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400',
  DELETE: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
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
  const pages = Math.ceil(total / PAGE_SIZE);

  const fmt = fmtDateTime;

  const resetFilters = () => { setModel(''); setAction(''); setUserId(''); setPage(0); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('auditLog.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('auditLog.subtitle', { count: total.toLocaleString() })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('auditLog.modelLabel')}</label>
          <select value={model} onChange={e => { setModel(e.target.value); setPage(0); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {MODELS.map(m => <option key={m} value={m}>{m || t('auditLog.allModels')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('auditLog.actionLabel')}</label>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(0); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {ACTIONS.map(a => <option key={a} value={a}>{a || t('auditLog.allActions')}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('auditLog.actorLabel')}</label>
          <input type="text" value={userId} placeholder={t('auditLog.actorPlaceholder')}
            onChange={e => { setUserId(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        {(model || action || userId) && (
          <button onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all">
            {t('auditLog.clearFilters')}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('auditLog.loading')}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-400 text-sm">{t('auditLog.noEntries')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[t('auditLog.colTimestamp'), t('auditLog.colAction'), t('auditLog.colModel'), t('auditLog.colRecordId'), t('auditLog.colActor')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-5 py-0.5 text-xs font-medium rounded-full ${ACTION_STYLE[log.action] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.model}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[160px]" title={log.recordId}>{log.recordId}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                    {log.user ? (
                      <span title={log.user.email}>
                        {log.user.firstName} {log.user.lastName}
                      </span>
                    ) : log.userId ? (
                      <span className="italic text-gray-400 dark:text-gray-500" title={log.userId}>
                        {t('auditLog.deletedUser')}
                      </span>
                    ) : (
                      <span className="italic text-gray-400 dark:text-gray-500">{t('auditLog.system')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {t('auditLog.pageInfo', { page: page + 1, pages, count: total.toLocaleString() })}
              </span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  {t('auditLog.previous')}
                </button>
                <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  {t('auditLog.next')}
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
