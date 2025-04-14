import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CallToAction() {
  const navigate = useNavigate();

  return (
    <section className='bg-white py-16 px-4 sm:px-6 lg:px-8 text-center'>
      <div className='max-w-3xl mx-auto'>
        <h2 className='text-3xl font-bold text-gray-900 mb-4'>
          Learn anything, anytime, anywhere
        </h2>
        <p className='text-lg text-gray-600 mb-8'>
          Join thousands of learners worldwide and start your learning journey today.
        </p>
        <div className='flex flex-col sm:flex-row justify-center gap-4'>
          <button
            onClick={() => navigate('/course-list')}
            className='px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm'
          >
            Browse Courses
          </button>
          <button 
            onClick={() => navigate('/sign-up')}
            className='px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </section>
  );
}