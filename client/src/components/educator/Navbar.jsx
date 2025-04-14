import React from 'react';
import { assets } from '../../assets/assets';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user } = useUser();

  return (
    <nav className='flex items-center justify-between px-4 md:px-8 border-b border-gray-200 py-3 bg-white sticky top-0 z-50'>
      <Link to='/' className='flex items-center'>
        <img 
          src={assets.logo} 
          alt='Logo' 
          className='w-28 lg:w-32 h-auto'
          loading='lazy'
        />
      </Link>
      
      <div className='flex items-center gap-4'>
        <p className='text-gray-600 hidden sm:block'>
          {user ? `Hi, ${user.fullName || 'User'}` : 'Welcome'}
        </p>
        {user ? (
          <UserButton afterSignOutUrl='/' />
        ) : (
          <Link to='/sign-in'>
            <img 
              className='w-8 h-8 rounded-full' 
              src={assets.profile_img} 
              alt='Profile'
              loading='lazy'
            />
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;