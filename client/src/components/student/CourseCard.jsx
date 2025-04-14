import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AddContext';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext);

  if (!course) return null;

  const rating = calculateRating?.(course);
  const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0; // Ensure rating is a valid number
  const price = course.coursePrice || 0;
  const discount = course.discount || 0;
  const finalPrice = price - (price * discount / 100);

  return (
    <Link 
      to={`/course/${course._id}`} 
      className='block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 bg-white'
    >
      <div className='relative pt-[56.25%] bg-gray-100'>
        <img
          className='absolute inset-0 w-full h-full object-cover'
          src={course.courseThumbnail || assets.default_course_image}
          alt={course.courseTitle || 'Course thumbnail'}
          onError={(e) => {
            e.target.src = assets.default_course_image;
          }}
          loading='lazy'
        />
      </div>

      <div className='p-4'>
        <h3 className='font-medium text-gray-900 line-clamp-2 mb-1'>
          {course.courseTitle || 'Untitled Course'}
        </h3>
        <p className='text-sm text-gray-500 mb-2'>
          {course.educator?.name || 'Unknown Instructor'}
        </p>

        <div className='flex items-center mb-2'>
          <span className='text-yellow-500 font-medium mr-1'>
            {validRating.toFixed(1)} {/* Use validRating here */}
          </span>
          <div className='flex mr-2'>
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(validRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
              </svg>
            ))}
          </div>
          <span className='text-xs text-gray-500'>({course.courseRatings?.length || 0})</span>
        </div>

        <div className='flex items-center justify-between'>
          <span className='font-semibold text-gray-900'>
            {currency}{finalPrice.toFixed(2)}
          </span>
          {discount > 0 && (
            <span className='text-xs line-through text-gray-500'>
              {currency}{price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
