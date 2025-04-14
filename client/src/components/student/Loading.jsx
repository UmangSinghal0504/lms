import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Loading = () => {
  const { path } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (path) {
      const timer = setTimeout(() => {
        navigate(`/${path}`);
      }, 2000); // Reduced from 5s to 2s for better UX
      return () => clearTimeout(timer);
    }
  }, [path, navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-white'>
      <div className='flex flex-col items-center gap-4'>
        <div 
          className='w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin'
          style={{ animationDuration: '1s' }}
        />
        <p className='text-gray-500'>Loading...</p>
      </div>
    </div>
  );
};

export default Loading;