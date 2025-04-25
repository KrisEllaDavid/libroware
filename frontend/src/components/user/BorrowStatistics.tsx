import React from 'react';
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
import { Bar, Pie } from 'react-chartjs-2';

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

const BorrowStatistics: React.FC<BorrowStatisticsProps> = ({ borrows }) => {
  // Process monthly activity data
  const monthlyActivity = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
  
  const barChartData = {
    labels: activity.labels,
    datasets: [
      {
        label: 'Books Borrowed',
        data: activity.borrowed,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
      },
      {
        label: 'Books Returned',
        data: activity.returned,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };
  
  const pieChartData = {
    labels: categories.labels,
    datasets: [
      {
        data: categories.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(40, 159, 64, 0.6)',
          'rgba(210, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(40, 159, 64, 1)',
          'rgba(210, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Borrowing Activity',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Book Categories Distribution',
      },
    },
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Your Borrowing Statistics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Monthly Activity</h3>
          <div className="h-80">
            <Bar options={barOptions} data={barChartData} />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Categories Distribution</h3>
          <div className="h-80">
            {categories.labels.length > 0 ? (
              <Pie options={pieOptions} data={pieChartData} />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowStatistics;