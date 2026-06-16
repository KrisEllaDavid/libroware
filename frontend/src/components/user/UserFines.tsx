import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_USER_FINES } from '../../graphql/queries';

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

  const { data, loading, error } = useQuery(GET_USER_FINES, {
    variables: { userId, take: 100 },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  const fines: Fine[] = data?.userFines ?? [];
  const outstanding = fines.filter(f => !f.waived && !f.paidAt).reduce((s, f) => s + f.amount, 0);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

  if (loading) return <div className="text-center py-4">{t('userFines.loading')}</div>;
  if (error) return <div className="text-red-500 py-4">{t('userFines.errorLoading', { message: error.message })}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t('userFines.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('userFines.outstanding')}:{' '}
          <span className={`font-semibold ${outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {outstanding.toLocaleString()} FCFA
          </span>
        </p>
      </div>

      {fines.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('userFines.noFines')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {[t('userFines.colBook'), t('userFines.colDaysOverdue'), t('userFines.colAmount'), t('userFines.colStatus'), t('userFines.colDate')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {fines.map(fine => {
                const isPaid = !!fine.paidAt;
                const isWaived = fine.waived;
                return (
                  <tr key={fine.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fine.borrow.book.title}</td>
                    <td className="px-4 py-3 text-center font-medium text-red-600 dark:text-red-400">
                      {fine.daysOverdue}{t('fines.daysSuffix')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {fine.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3">
                      {isWaived ? (
                        <span className="px-5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t('fines.waived')}</span>
                      ) : isPaid ? (
                        <span className="px-5 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{t('fines.paid')}</span>
                      ) : (
                        <span className="px-5 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{t('fines.pending')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(fine.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {fines.some(f => !f.waived && !f.paidAt) && (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          {t('userFines.payInPersonNote')}
        </p>
      )}
    </div>
  );
};

export default UserFines;
