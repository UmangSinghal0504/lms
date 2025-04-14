import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/AddContext';
import CourseCard from './CourseCard';

const CoursesSection = () => {
  const { allCourses } = useContext(AppContext);

  // Add more robust error handling
  if (!allCourses) {
    return (
      <div className='py-16 md:px-40 px-8'>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (!Array.isArray(allCourses) || allCourses.length === 0) {
    return (
      <div className='py-16 md:px-40 px-8'>
        <p>No courses available at the moment.</p>
      </div>
    );
  }

  try {
    return (
      <div className='py-16 md:px-40 px-8'>
        <h2 className='text-3xl font-medium text-gray-800'>Learn from the best</h2>
        <p className='text-sm md:text-base text-gray-500 mt-3'>
          Discover our top-rated courses across various categories. From coding and design to <br/> 
          business and wellness, our courses are crafted to deliver results.
        </p>
        
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:my-16 my-10'>
          {allCourses.slice(0, 4).map((course) => (
            <CourseCard 
              key={course._id}
              course={course}
            />
          ))}
        </div>

        <Link 
          to='/course-list' 
          onClick={() => window.scrollTo(0, 0)}
          className='inline-block border border-gray-500/30 hover:bg-gray-100 px-10 py-3 rounded text-gray-500 mt-4 transition-colors'
        >
          Show all courses
        </Link>
      </div>
    );
  } catch (error) {
    console.error("Error in CoursesSection:", error);
    return (
      <div className='py-16 md:px-40 px-8'>
        <p className="text-red-500">Error displaying courses. Please try again later.</p>
      </div>
    );
  }
};

export default CoursesSection;