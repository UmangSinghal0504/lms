import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { AppContext } from '../../context/AddContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Navbar = () => {
  const { isEducator, backendUrl, setIsEducator, getToken } = useContext(AppContext) || {};
  const location = useLocation();
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const becomeEducator = async () => {
    try {
      if (!user) {
        openSignIn();
        return;
      }

      if (isEducator) {
        navigate('/educator');
        return;
      }
      
      const token = await getToken?.();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const { data } = await axios.get(`${backendUrl}/api/educator/update-role`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setIsEducator(true);
        toast.success(data.message);
        navigate('/educator');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error becoming educator:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Something went wrong'
      );
    }
  };

  return (
    <header className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 ${location.pathname.includes('/course-list') ? 'bg-white' : 'bg-cyan-50'} shadow-sm`}>
      <Link to='/'>
        <img 
          src={assets.logo} 
          alt="Logo" 
          className="w-28 lg:w-32 h-auto cursor-pointer" 
          loading="lazy"
        />
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {user && (
          <div className="flex items-center gap-4">
            <button 
              onClick={becomeEducator}
              className={`px-4 py-2 rounded-full ${isEducator ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'} hover:opacity-90 transition`}
            >
              {isEducator ? 'Educator Dashboard' : 'Become Educator'}
            </button>
            <Link 
              to="/my-enrollments" 
              className="text-gray-600 hover:text-blue-600 transition"
            >
              My Enrollments
            </Link>
          </div>
        )}
        {user ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <button 
            onClick={() => openSignIn()}
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        )}
      </div>

      <div className='md:hidden flex items-center gap-4'>
        {user && (
          <button 
            onClick={becomeEducator}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded"
          >
            {isEducator ? 'Dashboard' : 'Teach'}
          </button>
        )}
        {user ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <button onClick={() => openSignIn()}>
            <img src={assets.user_icon} alt="User" className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;