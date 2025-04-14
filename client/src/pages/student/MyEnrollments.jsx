import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AddContext';
import { Line } from 'rc-progress';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';
import { useNavigate } from 'react-router-dom';

const MyEnrollments = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    calculateNoOfLectures,
    backendUrl,
    getToken,
    loading: contextLoading
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const [progressArray, setProgressArray] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const totalLectures = calculateNoOfLectures(course);
          const lectureCompleted = data.progressData?.lectureCompleted?.length || 0;
          
          return { totalLectures, lectureCompleted };
        })
      );
      setProgressArray(tempProgressArray);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseProgress();
    } else {
      setLoading(false);
    }
  }, [enrolledCourses]);

  if (contextLoading || loading) return <Loading />;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">My Enrollments</h1>
        
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <button
              onClick={() => navigate('/course-list')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrolledCourses.map((course, index) => {
                  const progress = progressArray[index] 
                    ? (progressArray[index].lectureCompleted * 100) / progressArray[index].totalLectures 
                    : 0;
                  
                  return (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img 
                              className="h-16 w-16 rounded object-cover" 
                              src={course.courseThumbnail} 
                              alt={course.courseTitle}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{course.courseTitle}</div>
                            <div className="mt-1 w-full sm:w-64">
                              <Line 
                                percent={progress} 
                                strokeWidth={2} 
                                trailWidth={2}
                                strokeColor="#3B82F6"
                                trailColor="#E5E7EB"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {calculateCourseDuration(course)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {progressArray[index] 
                          ? `${progressArray[index].lectureCompleted} of ${progressArray[index].totalLectures} lectures` 
                          : 'Loading...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/player/${course._id}`)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            progress === 100
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {progress === 100 ? 'Completed' : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyEnrollments;