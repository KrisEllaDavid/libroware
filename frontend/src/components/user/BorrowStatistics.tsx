import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardBody, CardHeader, EmptyState } from '../ui';
import { useChartTheme, SERIES, BRAND, BLUE } from '../dashboard/chartTheme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Borrow {
  id: string;
  borrowDate: string;
  returnDate: string | null;
  book: {
    id: string;
    title: string;
    categories: {
      id: string;
      name: string;
    }[];
  };
}

interface BorrowStatisticsProps {
  borrows: Borrow[];
}

/**
 * The member's own reading activity.
 *
 * These charts previously used Chart.js's stock demo palette — pink, sky
 * blue, lemon — on a green product, and rendered their titles inside the
 * canvas where they couldn't be styled or translated consistently with the
 * rest of the page. Series colours now come from the shared chart tokens, and
 * the titles are real headings on the card.
 */
const BorrowStatistics: React.FC<BorrowStatisticsProps> = ({ borrows }) => {
  const { t } = useTranslation();
  const chart = useChartTheme();

  // Process monthly activity data
  const monthlyActivity = () => {
    const monthNames = t('borrowStats.monthsShort', { returnObjects: true }) as string[];
    const currentYear = new Date().getFullYear();

    const borrowsByMonth = Array(12).fill(0);
    const returnsByMonth = Array(12).fill(0);

    borrows.forEach(borrow => {
      const borrowDate = new Date(borrow.borrowDate);
      if (borrowDate.getFullYear() === currentYear) {
        borrowsByMonth[borrowDate.getMonth()]++;
      }

      if (borrow.returnDate) {
        const returnDate = new Date(borrow.returnDate);
        if (returnDate.getFullYear() === currentYear) {
          returnsByMonth[returnDate.getMonth()]++;
        }
      }
    });

    return {
      labels: monthNames,
      borrowed: borrowsByMonth,
      returned: returnsByMonth
    };
  };

  // Calculate category distribution
  const categoryDistribution = () => {
    const categories: Record<string, number> = {};

    borrows.forEach(borrow => {
      borrow.book.categories.forEach(category => {
        if (categories[category.name]) {
          categories[category.name]++;
        } else {
          categories[category.name] = 1;
        }
      });
    });

    return {
      labels: Object.keys(categories),
      data: Object.values(categories)
    };
  };

  const activity = monthlyActivity();
  const categories = categoryDistribution();
  const hasActivity = activity.borrowed.some(Boolean) || activity.returned.some(Boolean);

  const barChartData = {
    labels: activity.labels,
    datasets: [
      {
        label: t('borrowStats.booksBorrowed'),
        data: activity.borrowed,
        backgroundColor: BRAND,
        borderRadius: 4,
        borderSkipped: false as const,
        maxBarThickness: 18,
      },
      {
        label: t('borrowStats.booksReturned'),
        data: activity.returned,
        backgroundColor: BLUE,
        borderRadius: 4,
        borderSkipped: false as const,
        maxBarThickness: 18,
      },
    ],
  };

  const pieChartData = {
    labels: categories.labels,
    datasets: [
      {
        data: categories.data,
        backgroundColor: categories.labels.map((_, i) => SERIES[i % SERIES.length]),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const tooltip = {
    backgroundColor: chart.tooltip.contentStyle.backgroundColor as string,
    titleColor: chart.tick.fill,
    bodyColor: chart.tick.fill,
    borderColor: chart.grid,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 10,
    displayColors: true,
    boxPadding: 4,
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chart.tick.fill,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          padding: 16,
          font: { size: 11 },
        },
      },
      title: { display: false },
      tooltip,
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: chart.grid },
        ticks: { color: chart.tick.fill, font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: chart.grid },
        border: { display: false },
        ticks: { precision: 0, color: chart.tick.fill, font: { size: 10 } },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chart.tick.fill,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          padding: 12,
          font: { size: 11 },
        },
      },
      title: { display: false },
      tooltip,
    },
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader
          title={t('borrowStats.monthlyActivity')}
          description={t('borrowStats.title')}
          bare
          className="pb-0"
        />
        <CardBody className="flex-1 pt-3">
          {hasActivity ? (
            <div className="h-[260px] w-full">
              <Bar options={barOptions} data={barChartData} />
            </div>
          ) : (
            <EmptyState
              compact
              icon="chart"
              title={t('borrowStats.noActivity', 'No activity this year')}
              description={t(
                'borrowStats.noActivityHint',
                'Borrow a book and your reading year starts filling in here.'
              )}
            />
          )}
        </CardBody>
      </Card>

      <Card className="flex flex-col">
        <CardHeader
          title={t('borrowStats.categoriesDistribution')}
          description={t('borrowStats.categoryChartTitle')}
          bare
          className="pb-0"
        />
        <CardBody className="flex-1 pt-3">
          {categories.labels.length > 0 ? (
            <div className="h-[260px] w-full">
              <Doughnut options={pieOptions} data={pieChartData} />
            </div>
          ) : (
            <EmptyState
              compact
              icon="tag"
              title={t('borrowStats.noCategoryData')}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default BorrowStatistics;
