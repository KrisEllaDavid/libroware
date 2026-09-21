import React from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
  StatSkeleton,
  cn,
} from '../ui';
import { useChartTheme, AMBER, BLUE, BRAND, PURPLE, RED } from './chartTheme';

/**
 * Library analytics.
 *
 * Layout reads top-to-bottom in decreasing granularity: the six figures that
 * answer "how is the library doing right now", then trend over time, then the
 * breakdowns. The KPI row is 2-up on a phone rather than 1-up — these are
 * short numbers, and stacking six full-width cards buries the trend chart
 * below three screens of scrolling.
 */

/* ── Chart card ────────────────────────────────────────────────────────────
   A chart needs a fixed pixel height; percentage heights inside a flex column
   collapse to zero in Recharts. Height steps up at `sm` so a phone doesn't
   give half its viewport to one chart. */
const ChartCard: React.FC<{
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  emptyLabel?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, description, loading, empty, emptyLabel, className, children }) => (
  <Card className={cn('flex flex-col', className)}>
    <CardHeader title={title} description={description} bare className="pb-0" />
    <CardBody className="flex-1 pt-3">
      {loading ? (
        <Skeleton className="h-[200px] w-full sm:h-[230px]" />
      ) : empty ? (
        <EmptyState compact icon="chart" title={emptyLabel ?? 'No data yet'} />
      ) : (
        <div className="h-[200px] w-full sm:h-[230px]">{children}</div>
      )}
    </CardBody>
  </Card>
);

const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const chart = useChartTheme();

  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'network-only' });
  const { data: trendsData, loading: trendsLoading } = useQuery(GET_BORROW_TRENDS, { variables: { months: 12 }, fetchPolicy: 'network-only' });
  const { data: topData,    loading: topLoading }    = useQuery(GET_TOP_BORROWED_BOOKS, { variables: { take: 8 }, fetchPolicy: 'network-only' });
  const { data: catData,    loading: catLoading }    = useQuery(GET_CATEGORY_BORROW_STATS, { fetchPolicy: 'network-only' });

  const s = statsData?.dashboardStats;
  const trends = trendsData?.borrowTrends ?? [];
  const topBooks = (topData?.topBorrowedBooks ?? []).map((b: any) => ({
    ...b,
    // The axis gets a truncated label; the tooltip keeps the full title.
    label: b.title.length > 20 ? `${b.title.slice(0, 18)}…` : b.title,
  }));
  const cats = catData?.categoryBorrowStats ?? [];

  const availPct = s ? Math.round((s.availableBooks / Math.max(s.totalBooks, 1)) * 100) : 0;
  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="chart"
        eyebrow={t('admin.tabs.home')}
        title={t('dashboard.title', 'Library overview')}
        description={t(
          'dashboard.subtitle',
          'Circulation, membership and inventory at a glance.'
        )}
      />

      {/* ── KPIs ── */}
      {statsLoading ? (
        <div className="space-y-4">
          <StatSkeleton count={6} />
        </div>
      ) : s ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon="books"
            tone="brand"
            label={t('dashboard.totalBooks')}
            value={fmt(s.totalBooks)}
            progress={availPct}
            sub={`${availPct}% ${t('dashboard.availableBooks')}`}
          />
          <StatCard
            icon="bookmark"
            tone="info"
            label={t('dashboard.activeBorrows')}
            value={fmt(s.borrowedBooks)}
            sub={`${fmt(s.overdueBooks)} ${t('dashboard.overdue')}`}
          />
          <StatCard
            icon="users"
            tone="accent"
            label={t('dashboard.members')}
            value={fmt(s.totalUsers)}
            sub={`${fmt(s.activeUsers)} ${t('dashboard.active30d')}`}
          />
          <StatCard
            icon="trend"
            tone="warning"
            label={t('dashboard.thisMonth')}
            value={fmt(s.borrowsThisMonth)}
            sub={`${fmt(s.totalBorrows)} ${t('dashboard.allTime')}`}
          />
          <StatCard
            icon="clock"
            tone="info"
            label={t('dashboard.reservations')}
            value={fmt(s.totalReservations)}
            sub={t('dashboard.pending')}
          />
          <StatCard
            icon="coins"
            tone={s.outstandingFines > 0 ? 'danger' : 'brand'}
            label={t('dashboard.outstanding')}
            value={`${fmt(s.outstandingFines)} F`}
            sub={`${fmt(s.collectedFines)} ${t('dashboard.collected')}`}
          />
        </div>
      ) : null}

      {/* ── Trend + top titles ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title={t('dashboard.trends')}
          description={t('dashboard.trendsSub', 'Borrows and returns over 12 months')}
          loading={trendsLoading}
          empty={trends.length === 0}
          emptyLabel={t('dashboard.noData')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="month"
                tick={chart.tick}
                tickLine={false}
                axisLine={{ stroke: chart.grid }}
              />
              <YAxis
                tick={chart.tick}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={44}
              />
              <Tooltip
                contentStyle={chart.tooltip.contentStyle}
                labelStyle={chart.tooltip.labelStyle}
                itemStyle={chart.tooltip.itemStyle}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="plainline"
                iconSize={14}
              />
              <Line
                type="monotone"
                dataKey="borrows"
                stroke={BRAND}
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                name={t('dashboard.borrowed')}
              />
              <Line
                type="monotone"
                dataKey="returns"
                stroke={BLUE}
                strokeWidth={2.25}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                name={t('dashboard.returns', 'Returns')}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('dashboard.topBooks')}
          description={t('dashboard.topBooksSub', 'Most borrowed titles')}
          loading={topLoading}
          empty={topBooks.length === 0}
          emptyLabel={t('dashboard.noData')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topBooks}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              barSize={13}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
              <XAxis
                type="number"
                tick={chart.tick}
                tickLine={false}
                axisLine={{ stroke: chart.grid }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={116}
                tick={{ ...chart.tick, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={chart.tooltip.cursor}
                contentStyle={chart.tooltip.contentStyle}
                labelStyle={chart.tooltip.labelStyle}
                itemStyle={chart.tooltip.itemStyle}
                labelFormatter={(_: any, payload: any) =>
                  payload?.[0]?.payload?.title ?? ''
                }
                formatter={(v: any) => [`${v}`, t('dashboard.borrowed')]}
              />
              {/* Rounded only on the growing end — a bar rounded at the axis
                  reads as floating off it. */}
              <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Breakdowns ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title={t('dashboard.byCategory')}
          loading={catLoading}
          empty={cats.length === 0}
          emptyLabel={t('dashboard.noData')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* A donut, not a solid pie: the hole gives the legend somewhere
                  to breathe and makes small slices easier to compare. */}
              <Pie
                data={cats}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={74}
                paddingAngle={2}
                stroke="none"
              >
                {cats.map((_: any, i: number) => (
                  <Cell key={i} fill={chart.series[i % chart.series.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chart.tooltip.contentStyle}
                labelStyle={chart.tooltip.labelStyle}
                itemStyle={chart.tooltip.itemStyle}
                formatter={(v: any, n: any) => [`${v} ${t('dashboard.borrowed')}`, n]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="flex flex-col">
          <CardHeader title={t('dashboard.inventory')} bare className="pb-0" />
          <CardBody className="flex-1 pt-3">
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : s ? (
              <div className="space-y-4">
                <Meter label={t('dashboard.available')} value={s.availableBooks} total={s.totalBooks} color={BRAND} />
                <Meter label={t('dashboard.borrowed')}  value={s.borrowedBooks}  total={s.totalBooks} color={BLUE} />
                <Meter label={t('dashboard.overdue')}   value={s.overdueBooks}   total={s.totalBooks} color={RED} />

                <dl className="space-y-2 border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
                  <Row label={t('dashboard.totalCopies')} value={fmt(s.totalBooks)} />
                  <Row label={t('dashboard.members')} value={fmt(s.totalUsers)} />
                  <Row
                    label={t('dashboard.pendingRes')}
                    value={fmt(s.totalReservations)}
                    accent="text-amber-700 dark:text-amber-400"
                  />
                </dl>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card className="flex flex-col lg:col-span-2 xl:col-span-1">
          <CardHeader title={t('dashboard.fineSummary')} bare className="pb-0" />
          <CardBody className="flex-1 pt-3">
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : s ? (
              <div className="space-y-3">
                <FineRow label={t('dashboard.outstanding')} value={s.outstandingFines} color={RED} />
                <FineRow label={t('dashboard.collected')}   value={s.collectedFines}   color={BRAND} />
                <FineRow label={t('dashboard.waived')}      value={s.waivedFines}      color={AMBER} />

                <div className="flex items-baseline justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('dashboard.totalIssued')}
                  </span>
                  <span
                    data-numeric
                    className="font-display text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {fmt(s.outstandingFines + s.collectedFines + s.waivedFines)} FCFA
                  </span>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

/* ── Small parts ─────────────────────────────────────────────────────────── */

const Meter: React.FC<{ label: string; value: number; total: number; color: string }> = ({
  label,
  value,
  total,
  color,
}) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span data-numeric className="font-semibold" style={{ color }}>
          {value.toLocaleString()}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent,
}) => (
  <div className="flex items-center justify-between">
    <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
    <dd
      data-numeric
      className={cn('font-semibold text-gray-800 dark:text-gray-200', accent)}
    >
      {value}
    </dd>
  </div>
);

const FineRow: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
    <span className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
      <span
        className="h-2 w-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
    <span data-numeric className="text-sm font-semibold" style={{ color }}>
      {value.toLocaleString()} F
    </span>
  </div>
);

export default AnalyticsDashboard;
