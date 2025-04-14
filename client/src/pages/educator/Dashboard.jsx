import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AddContext';
import axios from 'axios';
import Loading from '../../components/student/Loading';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator, loading } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message || 'Failed to load dashboard');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData();
    }
  }, [isEducator]);

  if (loading || localLoading || !dashboardData) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-10">Educator Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm text-gray-500">Total Courses</h3>
          <p className="text-2xl font-bold text-gray-800">{dashboardData?.totalCourses || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm text-gray-500">Total Students</h3>
          <p className="text-2xl font-bold text-gray-800">
            {dashboardData?.enrolledStudentsData?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm text-gray-500">Total Earnings</h3>
          <p className="text-2xl font-bold text-gray-800">
            {currency}{dashboardData?.totalEarnings?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Enrollments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Course</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.enrolledStudentsData?.length > 0 ? (
                dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={item?.student?.imageUrl || assets.profile_img}
                          alt={item?.student?.name || 'Student'}
                        />
                        <span>{item?.student?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{item?.courseTitle || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4" colSpan="2">
                    No recent enrollments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
