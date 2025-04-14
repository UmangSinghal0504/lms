import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AddContext';
import { useParams, useNavigate } from 'react-router-dom';
import SearchBar from '../../components/student/SearchBar';
import CourseCard from '../../components/student/CourseCard';
import { assets } from '../../assets/assets';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';

const CoursesList = () => {
  const { allCourses, loading } = useContext(AppContext);
  const { input } = useParams();
  const navigate = useNavigate();
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      const tempCourses = [...allCourses];
      if (input) {
        setFilteredCourses(
          tempCourses.filter(item =>
            item.courseTitle.toLowerCase().includes(input.toLowerCase())
          )
        );
      } else {
        setFilteredCourses(tempCourses);
      }
    }
  }, [allCourses, input]);

  if (loading) return <Loading />;

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Course Catalog</h1>
            <nav className="text-sm text-gray-500 mt-2">
              <span 
                className="text-blue-600 hover:underline cursor-pointer" 
                onClick={() => navigate('/')}
              >
                Home
              </span>
              <span> / Course List</span>
            </nav>
          </div>
          <SearchBar data={input} />
        </div>

        {input && (
          <div className="inline-flex items-center gap-3 px-4 py-2 border rounded-full mb-8 text-gray-600 bg-gray-50">
            <span>{input}</span>
            <button onClick={() => navigate('/course-list')}>
              <img src={assets.cross_icon} alt="Clear search" className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course._id} 
              course={course}
              onClick={() => navigate(`/course/${course._id}`)}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No courses found matching your search.</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CoursesList;