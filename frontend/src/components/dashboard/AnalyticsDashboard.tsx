import React from 'react';
import { useQuery } from '@apollo/client';
import {
  GET_DASHBOARD_STATS,
  GET_BORROW_TRENDS,
  GET_TOP_BORROWED_BOOKS,
  GET_CATEGORY_BORROW_STATS,
} from '../../graphql/queries';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Palette ────────────────────────────────────────────────────────────────
const EMERALD  = '#059669';
const BLUE     = '#3B82F6';
const AMBER    = '#F59E0B';
const RED      = '#EF4444';
const PURPLE   = '#8B5CF6';
const PIE_COLORS = [EMERALD, BLUE, AMBER, RED, PURPLE, '#06B6D4', '#EC4899', '#84CC16'];

// ── KPI card ───────────────────────────────────────────────────────────────
const KPI: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, color = EMERALD, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4">
    <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Section wrapper ────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);

// ── Skeleton loader ────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

// ── Main dashboard ─────────────────────────────────────────────────────────
const AnalyticsDashboard: React.FC = () => {
  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'network-only' });
  const { data: trendsData, loading: trendsLoading } = useQuery(GET_BORROW_TRENDS, { variables: { months: 12 }, fetchPolicy: 'network-only' });
  const { data: topData,    loading: topLoading }    = useQuery(GET_TOP_BORROWED_BOOKS, { variables: { take: 8 }, fetchPolicy: 'network-only' });
  const { data: catData,    loading: catLoading }    = useQuery(GET_CATEGORY_BORROW_STATS, { fetchPolicy: 'network-only' });

  const s    = statsData?.dashboardStats;
  const trends = trendsData?.borrowTrends ?? [];
  const topBooks = (topData?.topBorrowedBooks ?? []).map((b: any) => ({ ...b, title: b.title.length > 20 ? b.title.slice(0, 18) + '…' : b.title }));
  const cats = catData?.categoryBorrowStats ?? [];

  const availPct = s ? Math.round((s.availableBooks / Math.max(s.totalBooks, 1)) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : s ? (
          <>
            <KPI label="Total Books"    value={s.totalBooks}       sub={`${availPct}% available`}         color={EMERALD} icon={<BookIcon />} />
            <KPI label="Active Borrows" value={s.borrowedBooks}    sub={`${s.overdueBooks} overdue`}       color={BLUE}    icon={<BorrowIcon />} />
            <KPI label="Members"        value={s.totalUsers}        sub={`${s.activeUsers} active (30d)`}  color={PURPLE}  icon={<UsersIcon />} />
            <KPI label="This Month"     value={s.borrowsThisMonth}  sub={`${s.totalBorrows} all time`}     color={AMBER}   icon={<TrendIcon />} />
            <KPI label="Reservations"   value={s.totalReservations} sub="pending"                          color="#06B6D4" icon={<ClockIcon />} />
            <KPI label="Outstanding"    value={`${s.outstandingFines.toLocaleString()} F`} sub={`${s.collectedFines.toLocaleString()} collected`} color={RED} icon={<FineIcon />} />
          </>
        ) : null}
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Borrow trends */}
        <Section title="Borrow & Return Trends (12 months)">
          {trendsLoading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={trends} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="borrows" stroke={EMERALD} strokeWidth={2} dot={false} name="Borrows" />
                <Line type="monotone" dataKey="returns" stroke={BLUE}    strokeWidth={2} dot={false} name="Returns" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Top borrowed books */}
        <Section title="Top Borrowed Books">
          {topLoading ? <Skeleton className="h-52" /> : topBooks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No borrow data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={topBooks} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="title" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`${v} borrows`]} />
                <Bar dataKey="count" fill={EMERALD} radius={[0, 4, 4, 0]} name="Borrows" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Category breakdown */}
        <Section title="Borrows by Category">
          {catLoading ? <Skeleton className="h-52" /> : cats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={cats} dataKey="count" nameKey="category" cx="50%" cy="50%"
                  outerRadius={80} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {cats.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [`${v} borrows`, n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Inventory health */}
        <Section title="Inventory Health">
          {statsLoading ? <Skeleton className="h-52" /> : s ? (
            <div className="space-y-4 pt-2">
              <Bar2 label="Available" value={s.availableBooks} total={s.totalBooks} color={EMERALD} />
              <Bar2 label="Borrowed"  value={s.borrowedBooks}  total={s.totalBooks} color={BLUE} />
              <Bar2 label="Overdue"   value={s.overdueBooks}   total={s.totalBooks} color={RED} />
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between"><span>Total copies</span><span className="font-medium">{s.totalBooks}</span></div>
                <div className="flex justify-between"><span>Members</span><span className="font-medium">{s.totalUsers}</span></div>
                <div className="flex justify-between"><span>Pending reservations</span><span className="font-medium text-amber-600">{s.totalReservations}</span></div>
              </div>
            </div>
          ) : null}
        </Section>

        {/* Fine summary */}
        <Section title="Fine Summary (FCFA)">
          {statsLoading ? <Skeleton className="h-52" /> : s ? (
            <div className="space-y-3 pt-2">
              <FineStat label="Outstanding" value={s.outstandingFines} color={RED} />
              <FineStat label="Collected"   value={s.collectedFines}   color={EMERALD} />
              <FineStat label="Waived"      value={s.waivedFines}      color={AMBER} />
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span>Total issued</span>
                  <span>{(s.outstandingFines + s.collectedFines + s.waivedFines).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          ) : null}
        </Section>
      </div>
    </div>
  );
};

// ── Small helpers ────────────────────────────────────────────────────────────
const Bar2: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
        <span>{label}</span>
        <span className="font-medium" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const FineStat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-semibold" style={{ color }}>{value.toLocaleString()} F</span>
  </div>
);

// ── Inline SVG icons ──────────────────────────────────────────────────────
const BookIcon  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const BorrowIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const UsersIcon  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrendIcon  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const ClockIcon  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FineIcon   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default AnalyticsDashboard;
