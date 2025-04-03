import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AddContext';
import { assets, dummyDashboardData } from '../../assets/assets';

const Dashboard = () => {
  const { currency } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardData(dummyDashboardData);
      setLoading(false);
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return dashboardData ? (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="space-y-5 p-5">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex flex-wrap gap-5 items-center">
          {/* Total Enrolments */}
          <div className="flex items-center gap-3 shadow-md border border-blue-500 p-4 w-56 rounded-md">
            <img src={assets.patients_icon} alt="patients_icon" className="w-10 h-10" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.enrolledStudentsData?.length || 0}
              </p>
              <p className="text-base text-gray-500">Total Enrollments</p>
            </div>
          </div>

          {/* Total Courses */}
          <div className="flex items-center gap-3 shadow-md border border-blue-500 p-4 w-56 rounded-md">
            <img src={assets.appointments_icon} alt="courses_icon" className="w-10 h-10" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalCourses || 0}
              </p>
              <p className="text-base text-gray-500">Total Courses</p>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="flex items-center gap-3 shadow-md border border-blue-500 p-4 w-56 rounded-md">
            <img src={assets.earning_icon} alt="earnings_icon" className="w-10 h-10" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {currency} {dashboardData.totalEarnings || 0}
              </p>
              <p className="text-base text-gray-500">Total Earnings</p>
            </div>
          </div>
        </div>
      </div>

    <div>
      <h2 className='pb-4 text-lg font-medium'>Latest Enrolments</h2>
      <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden
      rounded-md bg-white border border-gray-500/20'>
        <table className='table-fixed md:table-auto w-full overflow-hidden'>
          <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
          <tr>
            <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>
              #</th>
              <th className='px-4 py-3 font-semibold'>Student Name</th>
              <th className='px-4 py-3 font-semibold'Course Title></th>
          </tr>
          </thead>
          <tbody className='text-sm text-gray-500'>
          {dashboardData.enrolledStudentsData.map((item, index) => (
            <tr key={index} className='border-b border-gray-500/20'>
              <td className='px-4 py-3 text-center hidden sm:table-cell'>
                {index + 1}</td>
                <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
                  <img 
                  src={item.student.imageUrl}
                  alt='Profile'
                  className='w-9 h-9 rounded-full'
                  />
                  <span className='truncate'>{item.student.name}</span>
                </td>
                <td className='px-4 py-3 truncate'>{item.courseTitle}</td>
                 </tr>
          ))}
          </tbody>

        </table>
      </div>
    </div>

    </div>
  ) : (
    <div className="text-center text-gray-600 text-lg">No data available</div>
  );
};

export default Dashboard;
