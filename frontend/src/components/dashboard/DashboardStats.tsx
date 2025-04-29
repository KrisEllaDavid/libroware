import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface DashboardStatsProps {
  bookStats: {
    total: number;
    available: number;
    borrowed: number;
    categories: { name: string; count: number }[];
    topBooks: { title: string; borrowCount: number }[];
    monthlyActivity: { month: string; borrows: number; returns: number }[];
  };
  userStats: {
    total: number;
    active: number;
    byRole: { role: string; count: number }[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a309ff', '#ff0980'];

const DashboardStats: React.FC<DashboardStatsProps> = ({ bookStats, userStats }) => {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Books</h3>
            <span className="text-emerald-500 dark:text-emerald-400 p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{bookStats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Books</p>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">{bookStats.available}</p>
              <p className="text-gray-500 dark:text-gray-400">Available</p>
            </div>
            <div>
              <p className="text-amber-600 dark:text-amber-400 font-medium">{bookStats.borrowed}</p>
              <p className="text-gray-500 dark:text-gray-400">Borrowed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Users</h3>
            <span className="text-blue-500 dark:text-blue-400 p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{userStats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Users</p>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 dark:bg-blue-400 rounded-full" 
                style={{ width: `${(userStats.active / userStats.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {userStats.active} active users ({Math.round((userStats.active / userStats.total) * 100)}%)
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity</h3>
            <span className="text-purple-500 dark:text-purple-400 p-2 rounded-full bg-purple-50 dark:bg-purple-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {bookStats.monthlyActivity.reduce((sum, item) => sum + item.borrows, 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Borrows</p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="text-emerald-500 dark:text-emerald-400 font-medium">
                {bookStats.monthlyActivity.reduce((sum, item) => sum + item.returns, 0)}
              </span> books returned
            </p>
          </div>
        </div>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Book Categories</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookStats.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {bookStats.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top Books */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Most Borrowed Books</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bookStats.topBooks}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="borrowCount" fill="#00C49F" name="Borrow Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={bookStats.monthlyActivity}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="borrows" stroke="#0088FE" activeDot={{ r: 8 }} name="Borrows" />
                <Line type="monotone" dataKey="returns" stroke="#FF8042" name="Returns" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* User Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Roles</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userStats.byRole}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="User Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats; 